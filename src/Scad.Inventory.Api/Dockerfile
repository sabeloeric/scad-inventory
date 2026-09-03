FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

COPY src/Scad.Inventory.Api/Scad.Inventory.Api.csproj src/Scad.Inventory.Api/
RUN dotnet restore src/Scad.Inventory.Api/Scad.Inventory.Api.csproj

COPY src/Scad.Inventory.Api/ src/Scad.Inventory.Api/
RUN dotnet publish src/Scad.Inventory.Api/Scad.Inventory.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "Scad.Inventory.Api.dll"]
