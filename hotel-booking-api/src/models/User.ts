import bcrypt from "bcryptjs";
import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface UserAttributes {
  id: string;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_picture: string | null;
  role: "user" | "admin";
  auth_provider: "local" | "google" | "facebook";
  google_id: string | null;
  facebook_id: string | null;
  email_verified: boolean;
  verification_token: string | null;
  reset_password_token: string | null;
  reset_password_expire: Date | null;
  is_active: boolean;
  last_login: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "password"
    | "phone_number"
    | "profile_picture"
    | "role"
    | "auth_provider"
    | "google_id"
    | "facebook_id"
    | "email_verified"
    | "verification_token"
    | "reset_password_token"
    | "reset_password_expire"
    | "is_active"
    | "last_login"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public password!: string | null;
  public first_name!: string;
  public last_name!: string;
  public phone_number!: string | null;
  public profile_picture!: string | null;
  public role!: "user" | "admin";
  public auth_provider!: "local" | "google" | "facebook";
  public google_id!: string | null;
  public facebook_id!: string | null;
  public email_verified!: boolean;
  public verification_token!: string | null;
  public reset_password_token!: string | null;
  public reset_password_expire!: Date | null;
  public is_active!: boolean;
  public last_login!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as UserAttributes;
    delete values.password;
    delete values.verification_token;
    delete values.reset_password_token;
    delete values.reset_password_expire;
    return values;
  }
}

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_picture: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },
      auth_provider: {
        type: DataTypes.ENUM("local", "google", "facebook"),
        defaultValue: "local",
      },
      google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      facebook_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verification_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reset_password_expire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: true,
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed("password") && user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};

export default User;
