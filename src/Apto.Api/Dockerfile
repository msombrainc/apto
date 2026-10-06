FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/Apto.Api/Apto.Api.csproj src/Apto.Api/
RUN dotnet restore src/Apto.Api/Apto.Api.csproj
COPY src/Apto.Api/ src/Apto.Api/
RUN dotnet publish src/Apto.Api/Apto.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Apto.Api.dll"]
