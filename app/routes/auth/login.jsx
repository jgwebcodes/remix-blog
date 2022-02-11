import { redirect, useActionData, json } from 'remix';
import { db } from '~/utils/db.server';
import { loginCheck, register, createUserSession } from '~/utils/session.server';

// function validateLoginType(loginType) {
// 	if (loginType === null) {
// 		return 'Login or Register action needs to be selected';
// 	}
// }

function validateUsername(username) {
	if (typeof username !== 'string' || username.length < 4) {
		return 'Username must be at least 4 characters';
	}
}

function validatePassword(password) {
	if (typeof password !== 'string' || password.length < 6) {
		return 'Password must be at least 6 characters';
	}
}

function badRequest(data) {
	return json(data, { status: 400 });
}

export const action = async ({ request }) => {
	const form = await request.formData();
	const loginType = form.get('loginType');
	const username = form.get('username');
	const password = form.get('password');

	const fields = { loginType, username, password };

	const fieldErrors = {
		// loginType: validateLoginType(loginType),
		username: validateUsername(username),
		password: validatePassword(password),
	};

	if (Object.values(fieldErrors).some(Boolean)) {
		console.log(fieldErrors);
		return badRequest({ fieldErrors, fields });
	}

	switch (loginType) {
		case 'login': {
			//Find user
			const user = await loginCheck({ username, password });

			//Check user
			if (!user) {
				return badRequest({
					fields,
					fieldErrors: { username: 'Invalid credentials' },
				});
			}

			//Create user session
			return createUserSession(user.id, '/posts');
		}

		case 'register': {
			//Check if user exist
			const userExists = await db.user.findFirst({
				where: {
					username,
				},
			});
			if (userExists) {
				return badRequest({
					fields,
					fieldErrors: { username: `User ${username} already exists` },
				});
			}

			//Create user
			const user = await register({ username, password });
			if (!user) {
				return badRequest({
					fields,
					formError: 'Something went wrong',
				});
			}

			//Create user session
			return createUserSession(user.id, '/posts');
		}

		default: {
			return badRequest({
				fields,
				formError: 'Login type is invalid',
			});
		}
	}
};

function login() {
	const actionData = useActionData();

	return (
		<div className='auth-container'>
			<div className='page-header'>
				<h1>Login</h1>
			</div>

			<div className='page-content'>
				<form method='POST'>
					<fieldset>
						<legend>Login or Register</legend>
						<label>
							<input type='radio' name='loginType' value='login' defaultChecked={!actionData?.fields?.loginType || actionData?.fields?.loginType === 'login'} /> Login
						</label>
						<label>
							<input type='radio' name='loginType' value='register' /> Register
						</label>
					</fieldset>

					<div className='form-control'>
						<label htmlFor='username'>Username</label>
						<input type='text' name='username' id='username' defaultValue={actionData?.fields?.username} />
						<div className='error'>{actionData?.fieldErrors?.username && actionData?.fieldErrors?.username}</div>
					</div>

					<div className='form-control'>
						<label htmlFor='password'>Password</label>
						<input type='password' name='password' id='password' defaultValue={actionData?.fields?.password} />
						<div className='error'>{actionData?.fieldErrors?.password && actionData?.fieldErrors?.password}</div>
					</div>

					<button className='btn btn-block' type='submit'>
						Submit
					</button>
				</form>
			</div>
		</div>
	);
}

export default login;
