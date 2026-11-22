# build stage
FROM golang:1.21-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/server .

# runtime stage
FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/bin/server /usr/local/bin/opendesk-server

ENV APP_PORT=8000
EXPOSE 8000
CMD ["/usr/local/bin/opendesk-server"]

