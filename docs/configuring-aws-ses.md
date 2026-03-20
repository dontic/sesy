## Setting Up AWS SES

### 1. Create an IAM User

1. Sign up for an AWS account [here](https://portal.aws.amazon.com/billing/signup)
2. In the AWS console, search for **IAM** and open it

   ![Search for IAM](./images/search_iam.png)

3. In the left sidebar, click **Users**

   ![Click on users](./images/users.png)

4. Click **Create user** in the top right

   ![Create user](./images/create_user.png)

5. Give the user any name you like

   ![Name user](./images/name_user.png)

6. On the permissions screen, select **Attach policies directly**

   ![Attach policies directly](./images/attach_policies.png)

7. Search for and attach both `AmazonSESFullAccess` and `AmazonSNSFullAccess`, then click **Next**

   ![AmazonSESFullAccess](./images/AmazonSESFullAccess.png)
   ![AmazonSNSFullAccess](./images/AmazonSNSFullAccess.png)

8. Click **Create user**

### 2. Generate Access Keys

9. Click on the newly created user

   ![Created user](./images/createduser.png)

10. Go to the **Security credentials** tab
11. Click **Create access key**

    ![Create access key](./images/createaccesskey.png)

12. Copy the **Access Key** and **Secret Key**, then paste them into the AWS SES settings page in your Sesy instance. Select your preferred AWS region.

    ![Sesy SES settings](./images/sesysessettings.png)

### 3. Request Production Access

13. New AWS accounts start in SES sandbox mode (you can only send to verified addresses). Submit a production access request through the AWS SES console.

    ![Request production](./images/requestproduction.png)

14. AWS will email you when approved. This usually takes a few hours to a day. In the meantime, you can start importing your audience in the **Audience** tab.