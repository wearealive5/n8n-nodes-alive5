import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { FormData } from 'formdata-node';

export class Alive5 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alive5 - Send SMS',
		name: 'alive5',
		group: ['communication'],
		version: 1,
		description: 'Send SMS messages via Alive5 API',
		defaults: {
			name: 'Alive5 - Send SMS',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'alive5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'From Phone Number',
				name: 'phoneNumberFrom',
				type: 'string',
				default: '+18323034408',
				placeholder: '+1234567890',
				description: 'The phone number to send the SMS from',
				required: true,
			},
			{
				displayName: 'To Phone Number',
				name: 'phoneNumberTo',
				type: 'string',
				default: '',
				placeholder: '+1234567890',
				description: 'The phone number to send the SMS to',
				required: true,
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'The message to send',
				required: true,
			},
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: 'f16bb507-0d57-47ae-99db-c9e86bc17f5e',
				description: 'The channel ID for the SMS',
				required: true,
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '30a619c8-2639-4329-881b-33078b1596a3',
				description: 'The user ID for the SMS',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const phoneNumberFrom = this.getNodeParameter('phoneNumberFrom', itemIndex) as string;
				const phoneNumberTo = this.getNodeParameter('phoneNumberTo', itemIndex) as string;
				const message = this.getNodeParameter('message', itemIndex) as string;
				const channelId = this.getNodeParameter('channelId', itemIndex) as string;
				const userId = this.getNodeParameter('userId', itemIndex) as string;

				const formData = new FormData();
				formData.append('phone_number_from', phoneNumberFrom);
				formData.append('phone_number_to', phoneNumberTo);
				formData.append('message', message);
				formData.append('channel_id', channelId);
				formData.append('user_id', userId);

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.alive5.com/public/1.0/conversations/sms/send',
					body: formData,
				});

				returnData.push({
					json: response,
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
