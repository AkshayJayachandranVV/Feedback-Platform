import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'test-uuid',
    email: 'admin@acowale.com',
    passwordHash: '',
    role: 'admin' as const,
    refreshTokenHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'jwt.accessSecret': 'test-secret',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshSecret': 'test-refresh-secret',
                'jwt.refreshExpiresIn': '7d',
                'app.nodeEnv': 'test',
              };
              return config[key];
            }),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'wrong@email.com', password: 'password' }, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(
        service.login({ email: 'admin@acowale.com', password: 'wrongpassword' }, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user data and set cookies on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(
        { email: 'admin@acowale.com', password: 'Admin@123' },
        mockResponse,
      );

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('admin@acowale.com');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token and cookies', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      const result = await service.logout('test-uuid', mockResponse);
      expect(result.success).toBe(true);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('test-uuid', null);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
    });
  });
});
