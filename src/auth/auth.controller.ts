import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body() body: { email: string; password: string; displayedName?: string }) {
        return this.auth.register(body.email, body.password, body.displayedName);
    }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.auth.login(body.email, body.password);
    }

    @Post("refresh")
    refresh(@Body() body: { sessionId: string; refresh_token: string }) {
        return this.auth.refresh(body.sessionId, body.refresh_token);
    }

    @Post('logout')
    logout(@Body() body: { sessionId: string }) {
        return this.auth.logout(body.sessionId);
    }
}