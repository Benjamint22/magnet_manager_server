"use strict";
import express from "express";
import https, { ServerOptions } from "https";
import fs from "fs";
import cors, { CorsOptions } from "cors";
import child_process from "child_process";
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

const systemctlParser = /([a-zA-Z\-\@0-9]*\.service)\s+[a-zA-Z]+\s+[a-zA-Z]+\s+([a-zA-Z]+)\s+(.+)/g
const app = express();
const sessions: { [key:string]:UserSession } = {};

function getSession(req: express.Request): UserSession {
    const body: {key: string} = req.body as any;
    return (sessions[body.key]);
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
    const systemctlOutput: string = child_process.execSync("systemctl --type=service --no-legend --quiet --no-page").toString();
    let result;
    let results: Service[] = [];
    while (result = systemctlParser.exec(systemctlOutput)) {
        results.push(new Service(result[1], result[2] as ServiceStatus, result[3].trimRight()));
    }
    res.send(results);
});
