![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-alive5

This is an n8n community node for sending SMS messages via the alive5 API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Send SMS**
  - Send SMS messages via alive5 API
  - Dynamically select a channel with a valid phone number
  - Dynamically select an agent (user) from the selected channel

## Credentials

The node requires the following credentials:

- **alive5 API**
  - API Key: Your alive5 API key

## Compatibility

This node has been tested with n8n version 1.0.0 and above.

## Usage

### Send SMS

This operation allows you to send SMS messages using the alive5 API.

#### Parameters

- **From Phone Number**
  - The phone number to send the SMS from (e.g., +1234567890)
- **To phone number**
  - The phone number to send the SMS to (e.g., +1234567890)
- **Message**
  - The text message to send
- **Channel**
  - Dynamically select a channel with a valid phone number
- **Agent**
  - Dynamically select an agent (user) from the selected channel

#### Example
```json
{
	"nodes": [
		{
			"parameters": {
				"fromPhoneNumber": "+1234567890",
				"toPhoneNumber": "+1234567890",
				"message": "Hello from n8n!",
				"channel": "Channel Name",
				"agent": "Agent Name"
			},
			"name": "Send SMS",
			"type": "n8n-nodes-alive5.SendSMS",
			"typeVersion": 1,
			"position": [
				300,
				300
			]
		}
	],
	"connections": {}
}
```
1. Add the alive5 node to your workflow.
2. Configure the alive5 API credentials with your API key.
3. Set the required parameters:
   - **From phone number**: Your sender phone number.
   - **To phone number**: Recipient's phone number.
   - **Message**: Your SMS message.
   - **Channel**: Select a channel with a valid phone number.
   - **Agent**: Select an agent from the selected channel.
4. Execute the workflow to send the SMS.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [alive5 API Documentation](https://documenter.getpostman.com/view/12135254/UVsQr3zh)

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
