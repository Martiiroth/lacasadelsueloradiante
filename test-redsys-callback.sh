#!/bin/bash

# Script para probar el callback de Redsys
# Simula una respuesta de Redsys con parámetros reales

echo "🧪 Probando callback de Redsys..."

# Parámetros de la URL original decodificados
MERCHANT_PARAMS="eyJEc19EYXRlIjoiMDglMkYxMCUyRjIwMjUiLCJEc19Ib3VyIjoiMDklM0EzOSIsIkRzX1NlY3VyZVBheW1lbnQiOiIxIiwiRHNfQW1vdW50IjoiMTAwIiwiRHNfQ3VycmVuY3kiOiI5NzgiLCJEc19PcmRlciI6IjkwOTExMjkxNzM5MSIsIkRzX01lcmNoYW50Q29kZSI6Ijk5OTAwODg4MSIsIkRzX1Rlcm1pbmFsIjoiMDAxIiwiRHNfUmVzcG9uc2UiOiIwMDAwIiwiRHNfVHJhbnNhY3Rpb25UeXBlIjoiMCIsIkRzX01lcmNoYW50RGF0YSI6IiIsIkRzX0F1dGhvcmlzYXRpb25Db2RlIjoiMzMxMTEzIiwiRHNfQ2FyZF9OdW1iZXIiOiI0NTQ4ODEqKioqKiowMDAzIiwiRHNfQ29uc3VtZXJMYW5ndWFnZSI6IjEiLCJEc19DYXJkX0NvdW50cnkiOiI3MjQiLCJEc19DYXJkX1R5cG9sb2d5IjoiQ09OU1VNTyIsIkRzX0NhcmRfQnJhbmQiOiIxIiwiRHNfUHJvY2Vzc2VkUGF5TWV0aG9kIjoiNzgiLCJEc19FQ0kiOiIwNSIsIkRzX1Jlc3BvbnNlX0Rlc2NyaXB0aW9uIjoiT1BFUkFDSU9OK0FVVE9SSVpBREEiLCJEc19Db250cm9sXzE3NTk5MDkxNTMwODAiOiIxNzU5OTA5MTUzMDgwIn0="
SIGNATURE="dHUhW1rf28M9l3VaZcLF30frN4j4makmshVtXOwYtyM="
SIGNATURE_VERSION="HMAC_SHA256_V1"

# Probar el callback por GET (como lo hace Redsys en la redirección)
echo "🔗 Probando callback por GET..."
curl -X GET "https://lacasadelsueloradianteapp.com/api/payments/redsys/callback?Ds_SignatureVersion=${SIGNATURE_VERSION}&Ds_MerchantParameters=${MERCHANT_PARAMS}&Ds_Signature=${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -v

echo ""
echo "✅ Prueba completada"