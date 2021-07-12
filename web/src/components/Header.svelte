<script lang="ts">
    export let mode: "lite" | "classic" = "lite"
</script>

<div class="container">
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a
                class="navbar-item"
                href="https://github.com/cla-assistant/contributor-assistant"
            >
                <img
                    src="logo.svg"
                    width="28"
                    alt="Contributor Assistant Logo"
                />
            </a>
            <h1 class="navbar-item"><strong>Migration</strong></h1>
        </div>

        <div class="navbar-menu">
            <div class="navbar-start">
                <a class="navbar-item" href={'#'} on:click={() => mode = "lite"}> Lite </a>

                <a class="navbar-item" href={'#'} on:click={() => mode = "classic"}> Classic </a>
            </div>
        </div>
    </nav>
</div>
