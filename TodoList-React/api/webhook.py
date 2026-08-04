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

SCOPES = ["https://www.googleapis.com/auth/drive"]
CONFIG_FILE_ID = os.environ.get("GOOGLE_DRIVE_FILE_ID")


def get_drive_service():
    creds_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    creds_dict = json.loads(creds_json)
    creds = service_account.Credentials.from_service_account_info(
        creds_dict, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


def gerar_chave():
    letras = "".join(random.choices(string.ascii_uppercase, k=4))
    numeros = "".join(random.choices(string.digits, k=4))
    return f"{letras}{numeros}"


def enviar_whatsapp(whatsapp, matricula_nome, license_key):
    # Insira aqui a URL da sua API de WhatsApp favorita (ex: Evolution API, Z-API, etc.)
    whatsapp_api_url = os.environ.get("WHATSAPP_API_URL")
    whatsapp_token = os.environ.get("WHATSAPP_TOKEN")
    
    if not whatsapp or not whatsapp_api_url:
        return

    mensagem = (
        f"Olá, *{matricula_nome}*! Seu pagamento Pix foi confirmado com sucesso. 🚀\n\n"
        f"Sua chave de acesso ao *Gestor de Baixas* é: *{license_key}*\n\n"
        f"Guarde bem este código para realizar seus logins."
    )

    headers = {
        "Content-Type": "application/json"
    }
    if whatsapp_token:
        headers["Authorization"] = f"Bearer {whatsapp_token}"

    payload = {
        "phone": whatsapp,
        "message": mensagem
    }

    try:
        requests.post(whatsapp_api_url, json=payload, headers=headers, timeout=10)
    except Exception as e:
        print("Erro ao enviar WhatsApp:", e)


def enviar_webhook_discord(license_key, customer_email, matricula_nome, whatsapp):
    webhook_url = os.environ.get("VITE_DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return

    payload = {
        "username": "Stripe Pix Bot",
        "content": "Novo pagamento Pix processado com sucesso!",
        "embeds": [{
            "title": "Nova Licença Gerada via Pix",
            "description": (
                "Um pagamento via Pix foi confirmado e a chave foi adicionada ao Drive."
            ),
            "color": int("16711680"),
            "fields": [
                {"name": "Código de Acesso", "value": license_key, "inline": True},
                {"name": "Usuário", "value": matricula_nome, "inline": False},
                {"name": "WhatsApp", "value": whatsapp if whatsapp else "Não informado", "inline": True},
                {"name": "E-mail", "value": customer_email, "inline": True},
                {"name": "Time", "value": "Agora mesmo", "inline": False},
            ],
        }],
    }

    try:
        requests.post(webhook_url, json=payload)
    except Exception as e:
        print("Erro ao enviar Webhook Discord:", e)


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_data = self.rfile.read(content_length)
            body = json.loads(body_data.decode("utf-8"))

            event_type = body.get("type")

            # Suporta tanto Checkout Session quanto PaymentIntent direto (Pix)
            if event_type in ["checkout.session.completed", "payment_intent.succeeded"]:
                object_data = body.get("data", {}).get("object", {})
                
                # Extrai metadados enviados na criação do Pix/Intenção
                metadata = object_data.get("metadata", {})
                matricula_nome = metadata.get("matricula_nome", "Cliente")
                whatsapp = metadata.get("whatsapp", "")
                
                # Pega o e-mail dependendo se veio de checkout ou payment_intent
                customer_email = "Cliente desconhecido"
                if "customer_details" in object_data:
                    customer_email = object_data.get("customer_details", {}).get("email", customer_email)
                elif "receipt_email" in object_data:
                    customer_email = object_data.get("receipt_email", customer_email)

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

                # 4. Enviar notificação para o WhatsApp do usuário
                if whatsapp:
                    enviar_whatsapp(whatsapp, matricula_nome, nova_chave)

                # 5. Enviar notificação para o Discord
                enviar_webhook_discord(nova_chave, customer_email, matricula_nome, whatsapp)

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

        except Exception as ex:
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"status": "error", "detalhe": str(ex)}).encode("utf-8")
            )
            return

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps(
                {"status": "active", "message": "Webhook endpoint is running"}
            ).encode("utf-8")
        )
