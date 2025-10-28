# 2.7 [OPTIONAL] Configure Postgresql for VSCode

You'll use the integrated VS Code PostgreSQL extension for seamless database management and query execution directly within the development environment.

**Installation**  

In our setup, this extension already gets installed when the devcontainer is being built. Nonetheless, to install it manually, search for `Postgres` in the extensions sidebar and install the one developed by Microsoft.

![PostgreSQL extension for VS Code](../img/postgres-extension.png)

**Connecting with our Database**  

We'll connect the extension to the database server of our application.

1. Click on the PostgreSQL extension

     ![PostgreSQL extension icon for VS Code](../img/postgres-extension-icon.png)

2. Select 'add connection' option

     ![add-connection](../img/add-connection.png)

3. Adding connection details.

    ![connection-details](../img/connection-details.png)

    - SERVER NAME  
    This is the database endpoint present in the overview tab of your PostgreSQL database server instance running in your resource group.
     ![db-server-name](../img/db-server-name.png)

    - USER NAME  
    This is your user name or email address that you use to sign in to azure.

    - PASSWORD  
    The password is the token that is generated to login to azure. Run the following command then use the generated token as password

        ```bash
        az account get-access-token --resource-type oss-rdbms --output json
        ```

    - DATABASE NAME  
    The database name that is used is `contracts`.

    - CONNECTION NAME  
    This can be anything. For now, we'll use `Invoice Pilot DB`.

4. Connected

     ![connection-details](../img/db-connected-successfully.png)

The extension is now setup and connected to our database server. This can now be used throughout the guide to interact with the database

!!!tip
    The token which is used as the password expires after some time and hence the connection to the database is terminated then. In such as a case, run the command to generate the token again and connect with the database using the new token.
