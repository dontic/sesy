# How to use this docker dev container

## Starting the dev container

1. Make sure you have docker installed in your system (For windows use WSL as dev containers are natively slow as hell)
2. Open this directory (.../backend/) with VSCode or Cursor
3. Make sure you have the dev containers extension installed
4. Hit `F1` and then "DevContainer: Reopen in container"

## Initial configuration

When starting the devcontainer for the first time or when regenerating it, you will need to:

1. Run `pipenv install`
2. Run `python manage.py migrate`

## Reseting the database

There might be sometimes when you might mess up the django migrations and the migrations and database won't match, prompting you to reset the database.

To do this just:

1. Close VSCode and stop the containers
2. Remove the `postgresdata` volume and delete the postgres container
3. Restart VSCode and reopen in container
4. A clean database will regenerate automatically
5. Run `python manage.py migrate`