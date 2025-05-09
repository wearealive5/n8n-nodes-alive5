import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Alive5Api implements ICredentialType {
	name = 'alive5Api';
	displayName = 'Alive5 API';
	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	// This credential is currently not used by any node directly
	// but the HTTP Request node can use it to make requests.
	// The credential is also testable due to the `test` property below
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-A5-APIKEY': '={{ $credentials.apiKey }}',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.alive5.com/public/1.0',
			url: '/account',
		},
	};
}
