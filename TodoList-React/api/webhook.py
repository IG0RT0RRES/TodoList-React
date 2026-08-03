from http.server import BaseHTTPRequestHandler
import io
import json
import os
import random
import string
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload
import requests

# Configurações do Google Drive (pegando das variáveis de ambiente da Vercel)
SCOPES = ['https://www.googleapis.com/auth/drive']
CONFIG_FILE_ID = os.environ.get("GOOGLE_DRIVE_FILE_ID")


def get_drive_service():
  creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
  creds_dict = json.loads(creds_json)
  creds = service_account.Credentials.from_service_account_info(
      creds_dict, scopes=SCOPES
  )
  return build('drive', 'v3', credentials=creds)


def gerar_chave():
  letras = ''.join(random.choices(string.ascii_uppercase, k=4))
  numeros = ''.join(random.choices(string.digits, k=4))
  return f'{letras}{numeros}'


def enviar_webhook_discord(license_key, customer_email):
  webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
  if not webhook_url:
    return

  payload = {
      "username": "Stripe License Bot",
      "content": "Novo pagamento processado com sucesso!",
      "embeds": [{
          "title": "Nova Licença Gerada",
          "description": (
              "Um pagamento foi confirmado no Stripe e a chave foi adicionada"
              f" ao Drive.\r\nE-mail do cliente: {customer_email}"
          ),
          "color": int("16711680"),
          "fields": [
              {"name": "Código de Acesso", "value": license_key, "inline": True},
              {"name": "Time", "value": "Agora mesmo", "inline": False},
          ],
      }],
  }

  try:
    requests.post(webhook_url, json=payload)
  except Exception as e:
    print("Erro ao enviar Webhook:", e)


class handler(BaseHTTPRequestHandler):

  def do_POST(self):
    content_length = int(self.headers.get("Content-Length", 0))
    body_data = self.rfile.read(content_length)

    try:
      body = json.loads(body_data.decode("utf-8"))
    except Exception:
      self.send_response(400)
      self.send_header("Content-type", "application/json")
      self.end_headers()
      self.wfile.write(
          json.dumps({"status": "error", "message": "Invalid payload"}).encode(
              "utf-8"
          )
      )
      return

    event_type = body.get("type")

    if event_type == "checkout.session.completed":
      session = body.get("data", {}).get("object", {})
      customer_email = session.get("customer_details", {}).get(
          "email", "Cliente desconhecido"
      )

      drive_service = get_drive_service()

      # 1. Baixar o Config.json atual do Google Drive
      request_file = drive_service.files().get_media(fileId=CONFIG_FILE_ID)
      fh = io.BytesIO()
      downloader = MediaIoBaseDownload(fh, request_file)
      done = False
      while not done:
        status, done = downloader.next_chunk()

      fh.seek(0)
      config_data = json.load(fh)

      # 2. Gerar a nova chave e adicionar no array "codigos_validos"
      nova_chave = gerar_chave()
      if "codigos_validos" not in config_data:
        config_data["codigos_validos"] = []

      config_data["codigos_validos"].append(nova_chave)

      # 3. Salvar temporariamente e atualizar no Google Drive
      temp_file_path = "/tmp/Config.json"
      with open(temp_file_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, ensure_ascii=False, indent=2)

      media = MediaFileUpload(temp_file_path, mimetype="application/json")
      drive_service.files().update(
          fileId=CONFIG_FILE_ID, media_body=media
      ).execute()

      # 4. Enviar notificação para o Discord
      enviar_webhook_discord(nova_chave, customer_email)

      self.send_response(200)
      self.send_header("Content-type", "application/json")
      self.end_headers()
      self.wfile.write(
          json.dumps({"status": "success", "license": nova_chave}).encode(
              "utf-8"
          )
      )
      return

    self.send_response(200)
    self.send_header("Content-type", "application/json")
    self.end_headers()
    self.wfile.write(
        json.dumps({"status": "ignored", "event": event_type}).encode("utf-8")
    )
            "title": "Nova Licença Gerada",
            "description": f"Um pagamento foi confirmado no Stripe e a chave foi adicionada ao Drive.\r\nE-mail do cliente: {customer_email}",
            "color": int("16711680") if "16711680" else 0,
            "fields": [
                {
                    "name": "Código de Acesso",
                    "value": license_key,
                    "inline": True
                },
                {
                    "name": "Time",
                    "value": "Agora mesmo",
                    "inline": False
                }
            ]
        }]
    }

    try:
        requests.post(webhook_url, json=payload)
    except Exception as e:
        print("Erro ao enviar Webhook:", e)

def handler(request):
    # Aqui você validaria o evento do Stripe (ex: checkout.session.completed)
    # Exemplo simplificado para pegar os dados da requisição POST do Stripe:
    try:
        body = request.get_json() if hasattr(request, 'get_json') else json.loads(request.data)
    except:
        return {"status": "error", "message": "Invalid payload"}, 400

    event_type = body.get("type")
    
    # Verifica se o evento é de checkout concluído com sucesso
    if event_type == "checkout.session.completed":
        session = body.get("data", {}).get("object", {})
        customer_email = session.get("customer_details", {}).get("email", "Cliente desconhecido")

        drive_service = get_drive_service()

        # 1. Baixar o Config.json atual do Google Drive
        request_file = drive_service.files().get_media(fileId=CONFIG_FILE_ID)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request_file)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        fh.seek(0)
        config_data = json.load(fh)

        # 2. Gerar a nova chave e adicionar no array "codigos_validos"
        nova_chave = gerar_chave()
        if "codigos_validos" not in config_data:
            config_data["codigos_validos"] = []
        
        config_data["codigos_validos"].append(nova_chave)

        # 3. Salvar o arquivo modificado temporariamente e enviar de volta para o Drive
        temp_file_path = "/tmp/Config.json"
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)

        media = MediaFileUpload(temp_file_path, mimetype='application/json')
        drive_service.files().update(
            fileId=CONFIG_FILE_ID,
            media_body=media
        ).execute()

        # 4. Disparar a notificação formatada para o Discord
        enviar_webhook_discord(nova_chave, customer_email)

        return {"status": "success", "license": nova_chave}, 200

    return {"status": "ignored", "event": event_type}, 200
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

        # Trata o evento de pagamento concluído com sucesso (usando chave/ponto em vez de .get())
        event_type = event['type'] if isinstance(event, dict) else getattr(event, 'type', None)
        
        if event_type == 'checkout.session.completed':
            session = event['data']['object'] if isinstance(event, dict) else event.data.object
            
            # Acesso seguro aos dados do objeto retornado pelo Stripe
            customer_details = session.get('customer_details') if isinstance(session, dict) else getattr(session, 'customer_details', {})
            if not customer_details:
                customer_details = {}
                
            customer_email = customer_details.get('email') if isinstance(customer_details, dict) else getattr(customer_details, 'email', None)
            client_reference_id = session.get('client_reference_id') if isinstance(session, dict) else getattr(session, 'client_reference_id', None)
            session_id = session.get('id') if isinstance(session, dict) else getattr(session, 'id', None)

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
