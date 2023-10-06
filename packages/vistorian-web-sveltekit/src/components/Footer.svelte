<script>
	const year = new Date().getFullYear();
	const height = '35px';
</script>

<div id="footerDiv">
	<a href="https://vishub.net/"
		><img src="/logos/logo-vishub.png" {height} alt="Logo for VisHub group" /></a
	>
	<a href="https://www.inria.fr/fr"
		><img src="/logos/logo-inria.png" {height} alt="Logo for INRIA" /></a
	>
	<a href="https://www.microsoft.com/en-us/research/"
		><img src="/logos/logo-msr.png" {height} alt="Logo for Microsoft" /></a
	>
	<a href="https://www.ed.ac.uk/"
		><img src="/logos/logo-edinburgh.png" {height} alt="Logo for University of Edinburgh" /></a
	>
</div>

<style>
	#footerDiv {
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
		margin-top: 40px;
		margin-bottom: 20px;
	}

	#footerDiv > a {
		padding-right: 1em;
		padding-left: 1em;
	}
</style>
