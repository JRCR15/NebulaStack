# external-mocks — integration

- `POST /v1/charge`: amount `666` → 402; `999` → 5s delay + 504; else 200 SUCCESS
- `POST /v1/whatsapp/messages` → 200
- `POST /v1/chat/completions` → 200 stub
