import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	LoggerProxy as Logger,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { FormData } from 'formdata-node';

const BASE_URL = 'https://api.alive5.com/public/1.1';

export class Alive5 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alive5',
		name: 'alive5',
		group: ['communication'],
		version: 1,
		description: 'Send SMS messages via Alive5 API',
		defaults: {
			name: 'Alive5',
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
					loadOptionsDependsOn: ['channelId'], // Trigger getAgents when channelId changes
					loadOptionsMethod: 'getAgents',
				},
				default: '',
				description:
					'Select a user from the selected channel. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				required: true,
				displayOptions: {
					hide: {
						channelId: [''],
					},
				},
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
		],
	};

	methods = {
		loadOptions: {
			async getChannels(this: ILoadOptionsFunctions) {
				try {
					let response = await this.helpers.request({
						method: 'GET',
						url: `${BASE_URL}/objects/channels-and-users/list`,
						headers: {
							'X-A5-APIKEY': (await this.getCredentials('alive5Api')).apiKey,
						},
					});
					response = typeof response != 'object' ? JSON.parse(response) : response;
					const items = response?.data?.Items || [];
					// Filter channels with valid phone numbers
					const validChannels = items.filter(
						(channel: { channel_phone_number?: string }) =>
							channel.channel_phone_number &&
							channel.channel_phone_number !== 'undefined' &&
							channel.channel_phone_number.startsWith('+'),
					);

					// Map valid channels to dropdown options
					return validChannels.map(
						(channel: {
							channel_phone_number: string;
							channel_id: string;
							channel_label: string;
						}) => ({
							name: channel.channel_label || 'Unnamed Channel',
							value: channel.channel_id,
							channel_phone_number: channel.channel_phone_number, // Include phone_number_from
						}),
					);
				} catch (error) {
					Logger.error('Error fetching channels:', error);
					throw new NodeOperationError(
						this.getNode(),
						`Failed to load channels: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			},

			async getAgents(this: ILoadOptionsFunctions) {
				try {
					const channelId = this.getNodeParameter('channelId', 0) as string;
					console.log('Selected Channel ID:', channelId);
					if (!channelId) {
						return []; // Return empty array when no channel is selected
					}

					let response = await this.helpers.request({
						method: 'GET',
						url: `${BASE_URL}/objects/channels-and-users/list`,
						headers: {
							'X-A5-APIKEY': (await this.getCredentials('alive5Api')).apiKey,
						},
					});
					response = typeof response != 'object' ? JSON.parse(response) : response;
					const items = response?.data?.Items || [];
					const channel = items.find((channel: { channel_id: string }) => channel.channel_id === channelId);
					if (!channel) {
						return []; // Return empty array if channel not found
					}

					// Validate channel agents
					if (!channel.agents || !Array.isArray(channel.agents)) {
						return []; // Return empty array if no agents found
					}

					// Map agents to dropdown options
					return channel.agents.map((agent: { user_id: string; screen_name: string }) => ({
						name: agent.screen_name || 'Unnamed Agent',
						value: agent.user_id,
					}));
				} catch (error) {
					Logger.error('Error fetching agents:', error);
					return []; // Return empty array on error
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const channelId = this.getNodeParameter('channelId', itemIndex) as string;
				const phoneNumberTo = this.getNodeParameter('phoneNumberTo', itemIndex) as string;
				const message = this.getNodeParameter('message', itemIndex) as string;
				const userId = this.getNodeParameter('userId', itemIndex) as string;
				const phoneNumberFrom = this.getNodeParameter('phoneNumberFrom', itemIndex) as string;

				// Validate phone numbers
				if (!phoneNumberFrom.match(/^\+[1-9]\d{1,14}$/)) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid "From" phone number format. Must be in E.164 format (e.g., +1234567890)',
					);
				}
				if (!phoneNumberTo.match(/^\+[1-9]\d{1,14}$/)) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid "To" phone number format. Must be in E.164 format (e.g., +1234567890)',
					);
				}

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
					headers: {
						'X-A5-APIKEY': (await this.getCredentials('alive5Api')).apiKey,
					},
				});

				Logger.debug('API Response:', response);

				// Validate response
				if (!response || typeof response !== 'object') {
					throw new NodeOperationError(this.getNode(), 'Invalid API response format');
				}

				returnData.push({
					json: response,
					pairedItem: itemIndex,
				});
			} catch (error) {
				Logger.error('Error executing node:', error);
				if (this.continueOnFail()) {
					returnData.push({
						json: this.getInputData(itemIndex)[0].json,
						error:
							error instanceof NodeOperationError
								? error
								: new NodeOperationError(this.getNode(), String(error)),
						pairedItem: itemIndex,
					});
					continue;
				}
				throw new NodeOperationError(
					this.getNode(),
					error instanceof Error ? error.message : String(error),
					{
						itemIndex,
					},
				);
			}
		}

		return [returnData];
	}
}
