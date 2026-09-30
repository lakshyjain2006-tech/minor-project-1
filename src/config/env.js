const fs = require("fs");
const path = require("path");

const envPath = path.resolve(
    __dirname,
    "../../.env"
);

if (fs.existsSync(envPath)) {

    const envFile =
        fs.readFileSync(
            envPath,
            "utf8"
        );

    envFile
        .split(/\r?\n/)
        .forEach(line => {

            const trimmed =
                line.trim();

            if (
                !trimmed ||
                trimmed.startsWith("#")
            ) {
                return;
            }

            const equalIndex =
                trimmed.indexOf("=");

            if (equalIndex === -1) {
                return;
            }

            const key =
                trimmed
                    .slice(0, equalIndex)
                    .trim();

            const value =
                trimmed
                    .slice(equalIndex + 1)
                    .trim()
                    .replace(/^["']|["']$/g, "");

            if (key) {

                process.env[key] =
                    value;

            }

        });

}

module.exports = {
    envPath
};