import crypto from "crypto";

export class User {
    public static users: { [key:string]:User } = {};

    private username: string;
    private passwordHash: string;

    public get Username(): string {
        return this.username;
    }

    public TestPassword(password: string): boolean {
        return crypto.createHash("md5").update(password).digest("hex") == this.passwordHash;
    }

    constructor(username: string, passwordHash: string) {
        this.username = username;
        this.passwordHash = passwordHash;
    }
}

[
    new User("benjamin", "99d043ab139acac92e5b50c8497b5aca")
].forEach((user: User) => {
    User.users[user.Username] = user;
});
