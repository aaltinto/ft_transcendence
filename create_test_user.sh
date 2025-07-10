#!/bin/bash

# Test kullanıcısı oluşturma scripti
echo "Test kullanıcısı oluşturuluyor..."

# API endpoint'i
API_URL="https://localhost:8443"

# Test kullanıcı verileri
USERNAME="testuser"
PASSWORD="testpass123"
EMAIL="test@example.com"

# Register endpoint'ine POST request gönder
curl -k -X POST \
  "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${USERNAME}\",
    \"password\": \"${PASSWORD}\",
    \"email\": \"${EMAIL}\"
  }"

echo ""
echo "Test kullanıcısı oluşturuldu!"
echo "Kullanıcı Adı: ${USERNAME}"
echo "Şifre: ${PASSWORD}"
echo ""
echo "Şimdi https://localhost:8443 adresinden giriş yapabilirsiniz."
