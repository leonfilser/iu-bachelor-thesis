// Interface für das JWT-Payload

export interface JwtPayload {
  sub: number; // user.id
  email: string;
}
