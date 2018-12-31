import { User } from "./user";

export class UserSession {
    private user: User

    public get User(): User {
        return this.user;
    }

    constructor(user: User) {
        this.user = user;
    }
}