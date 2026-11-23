# Deadzone Studio

The page of Deadzone Studio: what we make, and in what state it is. Static files in `strona/`, served by nginx
(`compose.yaml`, `nginx.conf`). The state of the projects comes from GitHub's API in the visitor's browser.

Deploy: copy the folder to the server and `docker compose up -d`; a changed page needs no restart.
