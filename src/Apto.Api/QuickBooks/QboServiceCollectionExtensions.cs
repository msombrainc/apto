namespace Apto.Api.QuickBooks;

public static class QboServiceCollectionExtensions
{
    public static IServiceCollection AddQuickBooksIntegration(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<QboOptions>(configuration.GetSection(QboOptions.SectionName));
        services.AddHttpClient(nameof(QboOAuthService));
        services.AddHttpClient(nameof(QboCustomerSyncService));
        services.AddScoped<QboOAuthService>();
        services.AddScoped<IQboCustomerSyncService, QboCustomerSyncService>();
        return services;
    }
}
