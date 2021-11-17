<script>
	import { getContext } from 'svelte';
	import {
		Button,
		Card,
		CardBody,
		CardHeader,
		CardSubtitle,
		CardText,
		CardTitle,
		Icon
	} from 'sveltestrap';

	import { setState } from 'vistorian-core/src/data/messenger';
	import { nodeLinkRestore, matrixRestore, dynamicegoRestore, mapRestore } from './bookmark';

	export let bookmarks;
	export let index;
	export let whichBookMarksToShow;

	let bookmark = bookmarks[index];

	const viewType = getContext('viewType');

	let expanded = false;
	const toggle = () => (expanded = !expanded);

	const deleteBookmarks = () => {
		bookmarks = bookmarks.filter((b) => b.id !== bookmark.id);
		localStorage.setItem('vistorianBookmarks', JSON.stringify(bookmarks));
	};

	const loadBookmark = () => {
		switch (bookmarks[index].viewType) {
			case 'nodelink':
				nodeLinkRestore(bookmarks, index, 1, 0);
				setState(bookmarks[index].controlsValues[0], 'nodelink');
				break;
			case 'matrix':
				matrixRestore(bookmarks, index, 1, 0);
				setState(bookmarks[index].controlsValues[0], 'matrix');
				break;
			case 'dynamicego':
				dynamicegoRestore(bookmarks, index, 1, 0);
				setState(bookmarks[index].controlsValues[0], 'dynamicego');
				break;
			case 'map':
				mapRestore(bookmarks, index, 1, 0);
				setState(bookmarks[index].controlsValues[0], 'map');
				break;
			case 'mat-nl':
			case 'tileview':
				setState(bookmarks[index].controlsValues[0], 'nodelink');
				nodeLinkRestore(bookmarks, index, 1, 0);
				setState(bookmarks[index].controlsValues[1], 'matrix');
				matrixRestore(bookmarks, index, 2, 1);

				if (bookmarks[index].viewType === 'tileview') {
					setState(bookmarks[index].controlsValues[2], 'dynamicego');
					dynamicegoRestore(bookmarks, index, 3, 2);
					setState(bookmarks[index].controlsValues[3], 'map');
					mapRestore(bookmarks, index, 4, 3);
				}
		}
	};

	$: {
		console.log({ bookmarks });
	}
</script>

<main>
	{#if whichBookMarksToShow === 'all' || bookmark.viewType === viewType}
		<Card class="mb-3">
			<CardHeader on:click={toggle}>
				<CardTitle>{bookmark.viewType.toUpperCase()}: {bookmark.title}</CardTitle>
			</CardHeader>
			<CardBody>
				<CardSubtitle>{bookmark.createdOn}</CardSubtitle>
				<CardText>
					{bookmark.note}
				</CardText>
				<Button on:click={deleteBookmarks}>
					<Icon name="trash" />
					Delete
				</Button>
				<Button on:click={loadBookmark}>
					<Icon name="arrow-repeat" />
					Load
				</Button>
			</CardBody>
		</Card>
	{/if}
</main>
