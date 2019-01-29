export enum ServiceStatus {
    Active = "active",
    Inactive = "inactive",
    Failed = "failed",
}

export class Service {
    private name: string;
    private active: ServiceStatus;
    private description: string;

    public get Name(): string {
        return this.name;
    }

    public get Active(): ServiceStatus {
        return this.active;
    }

    public get Description(): string {
        return this.description;
    }

    public toObject(): any {
        return {
            name: this.name,
            active: this.active.toString(),
            description: this.description,
        };
    }

    constructor(name: string, active: ServiceStatus, description: string) {
        this.name = name;
        this.active = active;
        this.description = description;
    }

    static fromJSON(test: any): Service {
        return new Service(
            test["name"],
            test["active"] as ServiceStatus,
            test["description"]
        );
    }
}
