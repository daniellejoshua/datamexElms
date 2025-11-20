<!DOCTYPE html><!DOCTYPE html>

<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"><html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

    <head>    <head>

        <meta charset="utf-8">        <meta charset="utf-8">

        <meta name="viewport" content="width=device-width, initial-scale=1">        <meta name="viewport" content="width=device-width, initial-scale=1">



        <title inertia>{{ config('app.name', 'Laravel') }}</title>        <title inertia>{{ config('app.name', 'Laravel') }}</title>



        <!-- Fonts -->        <!-- Fonts -->

        <link rel="preconnect" href="https://fonts.bunny.net">        <link rel="preconnect" href="https://fonts.bunny.net">

        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />



        <!-- Scripts -->        <!-- Scripts -->

        @routes        @routes

        @viteReactRefresh        @viteReactRefresh

        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])

        @inertiaHead        @inertiaHead

    </head>    </head>

    <body class="font-sans antialiased">    <body class="font-sans antialiased">

        @inertia        @inertia

    </body>    </body>

</html></html>
  