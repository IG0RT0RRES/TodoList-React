import os
import json
import io
from http.server import BaseHTTPRequestHandler
import stripe
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

# Configuração das chaves do Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Configurações do Google Drive
FILE_ID = os.environ.get("GOOGLE_DRIVE_FILE_ID")

def get_drive_service():
    service_account_info = json.loads(os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON"))
    creds = service_account.Credentials.from_service_account_info(
        service_account_info, scopes=['https://www.googleapis.com/auth/drive']
    )
    return build('drive', 'v3', credentials=creds)

def read_json_from_drive(service):
    request = service.files().get_media(fileId=FILE_ID)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    fh.seek(0)
    return json.loads(fh.read().decode('utf-8'))

def write_json_to_drive(service, data):
    json_str = json.dumps(data, indent=4)
    fh = io.BytesIO(json_str.encode('utf-8'))
    media = MediaIoBaseUpload(fh, mimetype='application/json', resumable=True)
    service.files().update(
        fileId=FILE_ID,
        media_body=media
    ).execute()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        payload = self.rfile.read(content_length)
        sig_header = self.headers.get('Stripe-Signature')

        event = None

        try:
            if endpoint_secret:
                # Valida a assinatura do webhook usando o segredo
                event = stripe.Webhook.construct_event(
                    payload, sig_header, endpoint_secret
                )
            else:
                event = json.loads(payload.decode('utf-8'))
        except ValueError as e:
            # Payload inválido
            self.send_response(400)
            self.end_headers()
            return
        except stripe.error.SignatureVerificationError as e:
            # Assinatura inválida
            self.send_response(400)
            self.end_headers()
            return

        # Trata o evento de pagamento concluído com sucesso
        if event.get('type') == 'checkout.session.completed':
            session = event.get('data', {}).get('object', {})
            
            # Acesso seguro aos dados do dicionário retornado pelo Stripe
            customer_details = session.get('customer_details') or {}
            customer_email = customer_details.get('email')
            client_reference_id = session.get('client_reference_id')
            session_id = session.get('id')

            try:
                # 1. Conecta ao Google Drive
                drive_service = get_drive_service()
                
                # 2. Lê o Config.json atual
                config_data = read_json_from_drive(drive_service)
                
                # 3. Atualiza os dados (adiciona a licença)
                if "licenses" not in config_data:
                    config_data["licenses"] = []
                
                config_data["licenses"].append({
                    "email": customer_email,
                    "client_reference_id": client_reference_id,
                    "status": "active",
                    "session_id": session_id
                })
                
                # 4. Salva de volta no Google Drive
                write_json_to_drive(drive_service, config_data)
                
            except Exception as e:
                print(f"Erro ao atualizar o Google Drive: {e}")
                self.send_response(500)
                self.end_headers()
                return

        # Responde ao Stripe que recebeu o evento com sucesso
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Success')
        return