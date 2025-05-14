import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { FormData } from 'formdata-node';

const BASE_URL = 'https://api.alive5.com/public/1.1';

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
		icon: 'file:alive5.svg',
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
				displayName: 'Channel Name or ID',
				name: 'channelId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getChannels',
				},
				default: '',
				description:
					'Select a channel. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				required: true,
			},
			{
				displayName: 'User Name or ID',
				name: 'userId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['channelId'],
					loadOptionsMethod: 'getAgents',
				},
				default: '',
				description:
					'Select an user from the selected channel. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				required: true,
			},
		],
	};

	methods = {
		loadOptions: {
			// Fetch channels with valid phone numbers
			async getChannels(this: ILoadOptionsFunctions) {
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://api.alive5.com/public/1.1/objects/channels-and-users/list',
					headers: {
						'X-A5-APIKEY': (await this.getCredentials('alive5Api')).apiKey,
					},
				});

				// Store the full response for later use
				this.getWorkflowStaticData('node').channelsData = response.data.Items;

				// Filter channels with valid phone numbers
				const channels = response.data.Items.filter(
					(channel: { channel_phone_number: string }) =>
						channel.channel_phone_number && channel.channel_phone_number !== 'undefined',
				);

				return channels.map((channel: { channel_id: string; channel_label: string }) => ({
					name: channel.channel_label,
					value: channel.channel_id,
				}));
			},

			// Fetch agents from the selected channel
			async getAgents(this: ILoadOptionsFunctions) {
				const channelId = this.getNodeParameter('channelId', 0) as string;

				// Retrieve stored channel data
				const channelsData = this.getWorkflowStaticData('node').channelsData as Array<{
					channel_id: string;
					agents: Array<{ user_id: string; screen_name: string }>;
				}>;

				// Find the selected channel
				const channel = channelsData.find((channel) => channel.channel_id === channelId);

				if (!channel) {
					throw new NodeOperationError(this.getNode(), 'Channel not found');
				}

				// Map agents to dropdown options
				return channel.agents.map((agent: { user_id: string; screen_name: string }) => ({
					name: agent.screen_name,
					value: agent.user_id,
				}));
			},
		},
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
					url: `${BASE_URL}/conversations/sms/send`,
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
