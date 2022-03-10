import type { LoaderFunction, LinksFunction } from 'remix';
import { json, Form } from 'remix';
import { Outlet, useLoaderData, Link } from 'remix';
import { db } from '~/utils/db.server';
import { getUser } from '~/utils/session.server';
import stylesUrl from '~/styles/jokes.css';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

// NOTE: prefetch='intent' on a Link works to preload its content when the link is just hovered over in case it is visited later. Awesome in case of a slow network connection, the navigation seems natural instead of too long as for other sites

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	jokeListItems: Array<{ id: string; name: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);

	// in the official deployed version of the app, we don't want to deploy
	// a site with unmoderated content, so we only show users their own jokes
	// * With Prisma
	const jokeListItems = user
		? await db.joke.findMany({
				take: 5,
				select: { id: true, name: true },
				where: { jokesterId: user.id },
				orderBy: { createdAt: 'desc' }
		  })
		: [];

	// * Without Prisma
	// const jokes = await db.joke.findMany();
	//const jokeListItems = jokes.map((joke) => ({ id: joke.id, name: joke.name }));

	const data: LoaderData = {
		jokeListItems,
		user
	};

	return json(data);
};

export default function JokesRoute() {
	const data = useLoaderData<LoaderData>();
	return (
		<div className='jokes-layout'>
			<header className='jokes-header'>
				<div className='container'>
					<h1 className='home-link'>
						<Link to='/' title='Remix Jokes' aria-label='Remix Jokes'>
							<span className='logo'>🤪</span>
							<span className='logo-medium'>J🤪KES</span>
						</Link>
					</h1>
					{data.user ? (
						<div className='user-info'>
							<span>{`Hi ${data.user.username}`}</span>
							<Form action='/logout' method='post'>
								<button type='submit' className='button'>
									Logout
								</button>
							</Form>
						</div>
					) : (
						<Link to='/login'>Login</Link>
					)}
				</div>
			</header>
			<main className='jokes-main'>
				<div className='container'>
					<div className='jokes-list'>
						{data.jokeListItems.length ? (
							<>
								<Link to='.'>Get a random joke</Link>
								<p>Here are a few more jokes to check out:</p>
								<ul>
									{data.jokeListItems.map(({ id, name }) => (
										<li key={id}>
											<Link to={id} prefetch='intent'>
												{name}
											</Link>
										</li>
									))}
								</ul>
								<Link to='new' className='button'>
									Add your own
								</Link>
							</>
						) : null}
					</div>
					<div className='jokes-outlet'>
						<Outlet />
					</div>
				</div>
			</main>
			<footer className='jokes-footer'>
				<div className='container'>
					<Link reloadDocument to='/jokes.rss'>
						RSS
					</Link>
				</div>
			</footer>
		</div>
	);
}
