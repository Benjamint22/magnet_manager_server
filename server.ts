"use strict";
import express from "express";
import https, { ServerOptions } from "https";
import fs from "fs";
import cors, { CorsOptions } from "cors";
import child_process, { SpawnSyncReturns } from "child_process";
import crypto from "crypto";
import { Service, ServiceStatus } from "./classes/service";
import { UserSession } from "./classes/usersession";
import { User } from "./classes/user";

const keypath: string = "/etc/letsencrypt/live/benjamintaillon.com";
const httpsOptions: ServerOptions = {
    key: fs.readFileSync(`${keypath}/privkey.pem`),
    cert: fs.readFileSync(`${keypath}/cert.pem`),
}
const corsOptions: CorsOptions = {
    origin: "http://benjamintaillon.com",
    optionsSuccessStatus: 200,
};

const app = express();
const sessions: { [key:string]:UserSession } = {};
let services: Service[] = [];

function getSession(req: express.Request): UserSession {
    const body: {key: string} = req.body as any;
    return (sessions[body.key]);
}

function checkServiceExists(name: String): Service | undefined {
    name = name.toLowerCase();
    return services.find((element) => element.Name.toLowerCase() === name);
}

function refreshServiceStatus(service: Service): Promise<ServiceStatus> {
    return new Promise<ServiceStatus>((resolve, reject) => {
        const process: child_process.ChildProcess = child_process.spawn("systemctl", ["is-active", service.Name]);
        process.stdout.on("data", (data: ServiceStatus) => {
           services[services.indexOf(service)] = new Service(
               service.Name,
               data,
               service.Description,
           );
           resolve(data);
        })
        process.stderr.on("data", (err) => {
            reject(err);
        });
        process.on("exit", (code) => {
            reject(`Exited with code ${code}.`);
        });
    });
}

async function refreshServicesList(): Promise<void> {
    return new Promise<void>((resolve) => {
        console.log("Refreshing services list...");
        child_process.exec("./bash/listservices.sh", (_, stdout) => {
            console.log("Parsing services list...")
            const objServices: any[] = JSON.parse(stdout);
            services = [];
            objServices.forEach((service: any) => services.push(Service.fromJSON(service)));
            console.log("Done parsing!");
            resolve();
        });
    });
}

https.createServer(httpsOptions, app).listen(25569, () => {
    console.log("Server started!");
});

app.use(express.json());
app.use(cors(corsOptions));

app.route("/login").post((req, res) => {
    const request: {login: string, password: string} = req.body;
    if (request.login == null || request.password == null) {
        res.sendStatus(400);
        return;
    }
    const connectingUser: User = User.users[request.login];
    if (connectingUser == null) {
        res.status(401).send("login");
        return;
    } else if (!connectingUser.TestPassword(request.password)) {
        res.status(401).send("password");
        return;
    }
    const key: string = crypto.randomBytes(32).toJSON().data.map(byte => (<number>byte).toString(16).toUpperCase()).join("");
    sessions[key] = new UserSession(connectingUser);
    res.send({
        key: key
    });
});

app.route("/services/list").post((req, res) => {
    if (!getSession(req)) {
        res.sendStatus(403);
        return;
    }
    res.send(JSON.stringify(services.map((service) => service.toObject())));
});

app.route("/services/status").post(async (req, res) => {
    if (!getSession(req)) {
        res.sendStatus(403);
        return;
    }
    const serviceName: string = req.body.serviceName;
    if (serviceName == null) {
        res.sendStatus(400);
        return;
    }
    const service: Service | undefined = checkServiceExists(serviceName);
    if (service == undefined) {
        res.sendStatus(404);
        return;
    }
    const status: ServiceStatus = await refreshServiceStatus(service);
    res.send(status);
});

app.route("/services/stop").post((req, res) => {
    if (!getSession(req)) {
        res.sendStatus(403);
        return;
    }
    const serviceName: string = req.body.serviceName;
    if (serviceName == null) {
        res.sendStatus(400);
        return;
    }
    const service: Service | undefined = checkServiceExists(serviceName);
    if (service == undefined) {
        res.sendStatus(404);
        return;
    }
    const systemctlOutput: SpawnSyncReturns<Buffer> = child_process.spawnSync("systemctl", ["stop", serviceName], {});
    if (systemctlOutput.stderr.length !== 0) {
        res.status(500).send(systemctlOutput.stderr.toString());
        return;
    }
    res.sendStatus(200);
});

app.route("/services/start").post((req, res) => {
    if (!getSession(req)) {
        res.sendStatus(403);
        return;
    }
    const serviceName: string = req.body.serviceName;
    if (serviceName == null) {
        res.sendStatus(400);
        return;
    }
    const service: Service | undefined = checkServiceExists(serviceName);
    if (service == undefined) {
        res.sendStatus(404);
        return;
    }
    const systemctlOutput: SpawnSyncReturns<Buffer> = child_process.spawnSync("systemctl", ["start", serviceName], {});
    if (systemctlOutput.stderr.length !== 0) {
        res.status(500).send(systemctlOutput.stderr.toString());
        return;
    }
    res.sendStatus(200);
});

app.route("/services/restart").post((req, res) => {
    if (!getSession(req)) {
        res.sendStatus(403);
        return;
    }
    const serviceName: string = req.body.serviceName;
    if (serviceName == null) {
        res.sendStatus(400);
        return;
    }
    const service: Service | undefined = checkServiceExists(serviceName);
    if (service == undefined) {
        res.sendStatus(404);
        return;
    }
    const systemctlOutput: SpawnSyncReturns<Buffer> = child_process.spawnSync("systemctl", ["restart", serviceName], {});
    if (systemctlOutput.stderr.length !== 0) {
        res.status(500).send(systemctlOutput.stderr.toString());
        return;
    }
    res.sendStatus(200);
});

setInterval(() => {
    refreshServicesList();
}, 60 * 1000)
refreshServicesList();
