# Redeploy App to Azure

If you want to redeploy the application, you can do so using the Azure Developer CLI. This is useful when you update the backend or frontend code and need to redeploy your changes to the live application.

Because you used `azd` for provisioning and deployment, this is as simple as calling `azd up` (to push all changes in both infrastructure and application) or running `azd deploy` if you want only to rebuild and deploy the application changes you made in this project.

!!! tip "Understand the difference between `azd up` and `azd deploy`"

    The `azd up` and `azd deploy` commands are both part of the Azure Developer CLI, but they serve different purposes:

    - `azd up` is used to package, provision, and deploy your application to Azure. It sets up the entire environment, including infrastructure and application code, from scratch. It's typically used when you're starting a new project or making significant changes to your infrastructure.

    - `azd deploy` is used to update an existing deployment. It's helpful when making iterative changes to your application without needing to re-provision the entire environment. This command is ideal for continuous development and deployment scenarios where you frequently update your application.

    In other words, use `azd up` when setting everything up from the beginning and `azd deploy` when updating an existing deployment.

## Deploy the Updated App

To deploy the updated app, follow the steps below:

1. Open a new integrated terminal in Visual Studio Code.

2. Ensure you are at the root of your repository.

3. Use the following commands to deploy updates to the backend, frontend, or the entire application as needed.

    - For deploying only backend changes:  
        <!-- markdownlint-disable MD046 -->
        ```bash
        azd deploy API
        ```

    - For deploying only frontend changes:  
        <!-- markdownlint-disable MD046 -->
        ```bash
        azd deploy UserPortal
        ```

    - For deploying whole application:  
        <!-- markdownlint-disable MD046 -->
        ```bash
        azd deploy
        ```

## Test the Deployed App

After deployment, open the Azure portal and navigate to your Container App resource. Use the Application URL to access the Invoice Pilot Portal and verify your changes are live by interacting with the dashboard and copilot features.

---

_You made it! That was a lot to cover - but don't worry! Now that you have a fork of the repo, you can revisit ideas at your own pace! Before you go, there are some important cleanup tasks you need to do!!_

---

!!! note "THANK YOU: Let's wrap up the session by cleaning up resources!"
