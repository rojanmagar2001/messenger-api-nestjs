import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import { NewUserDTO } from './dtos/new-user.dto';
import { ExistingUserDTO } from './dtos/existing-use.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async getUsers() {
    return this.userRepository.find();
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
      select: ['id', 'firstName', 'lastName', 'email', 'password'],
    });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordCorrect = await this.doesPasswordMatch(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      return null;
    }

    return user;
  }

  async register(newUser: Readonly<NewUserDTO>): Promise<UserEntity> {
    const { firstName, lastName, email, password } = newUser;

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Account with that email already exists!');
    }

    const hashedPassword = await this.hashPassword(password);

    const savedUser = await this.userRepository.save({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    delete savedUser.password;
    return savedUser;
  }

  async login(existingUser: ExistingUserDTO) {
    const { email, password } = existingUser;

    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException();
    }

    const jwt = await this.jwtService.signAsync({
      user,
    });

    return { token: jwt };
  }

  async verifyJwt(jwt?: string): Promise<{
    exp: number;
  }> {
    if (!jwt) {
      throw new UnauthorizedException();
    }

    try {
      const { exp } = await this.jwtService.verifyAsync(jwt);
      return { exp };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
