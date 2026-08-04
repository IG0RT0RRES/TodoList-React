import os
import stripe
from flask import Flask, request, jsonify

app = Flask(__name__)
# Pega a chave secreta direto das variáveis de ambiente da Vercel
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@app.route('/api/criar-pix', methods=['POST'])
def criar_pix():
    try:
        dados = request.get_json() or {}
        
        # Dados do usuário informados antes do pagamento
        matricula_nome = dados.get("matricula_nome", "Não informado")
        whatsapp = dados.get("whatsapp", "")
        email = dados.get("email", "")
        recurso = dados.get("recurso", "CSRELC020") # Ex: CSRELC020

        # Cria um PaymentIntent especificando o Pix e salvando os metadados
        intent = stripe.PaymentIntent.create(
            amount=1000, # Valor em centavos (R$ 10,00 - ajuste conforme necessário)
            currency='brl',
            payment_method_types=['pix'],
            metadata={
                "matricula_nome": matricula_nome,
                "whatsapp": whatsapp,
                "email": email,
                "recurso": recurso
            }
        )
        
        pix_data = intent.get('next_action', {}).get('pix_display_qr_code', {})
        
        qr_code_url = pix_data.get('image_url_png')
        copia_cola = pix_data.get('data')
        payment_intent_id = intent.get('id')

        return jsonify({
            "success": True,
            "qr_code_url": qr_code_url,
            "copia_cola": copia_cola,
            "payment_intent_id": payment_intent_id
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
