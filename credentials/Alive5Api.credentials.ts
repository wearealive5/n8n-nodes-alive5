import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Alive5Api implements ICredentialType {
	name = 'alive5Api';
	displayName = 'Alive5 API';
	documentationUrl = 'https://support.alive5.com/public-api-overview';
	icon = 'file:icons/alive5.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.alive5.com/public/1.1',
			placeholder: 'https://api.alive5.com/public/1.1',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-A5-APIKEY': '={{ $credentials.apiKey }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.alive5.com/public/1.0',
			url: '/account',
		},
	};
}
