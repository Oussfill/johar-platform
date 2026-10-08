import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message: "Password must contain uppercase, lowercase, number and special character",
  })
  password!: string;
}

export class GenerateOtpDto {
  @ApiProperty({ enum: ["login", "registration", "password_reset", "mfa"] })
  @IsString()
  @IsIn(["login", "registration", "password_reset", "mfa"])
  purpose!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "OTP must be exactly 6 digits" })
  code!: string;

  @ApiProperty({ enum: ["login", "registration", "password_reset", "mfa"] })
  @IsString()
  @IsIn(["login", "registration", "password_reset", "mfa"])
  purpose!: string;
}

export class RegisterMfaDto {
  @ApiProperty({ enum: ["TOTP"] })
  @IsString()
  @IsIn(["TOTP"], { message: "Only TOTP is currently supported" })
  type!: string;

  @ApiProperty({ example: "My Authenticator" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;
}

export class VerifyMfaDto {
  @ApiProperty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "MFA code must be exactly 6 digits" })
  code!: string;
}

export class RemoveMfaDto {
  @ApiProperty()
  @IsString()
  deviceId!: string;
}
