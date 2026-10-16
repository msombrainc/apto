namespace Apto.Api.QuickBooks;

public static class QboServiceCollectionExtensions
{
    public static IServiceCollection AddQuickBooksIntegration(
        this IServiceCollection services,
        IConfiguration configuration,
        bool registerWorker = true)
    {
        services.Configure<QboOptions>(configuration.GetSection(QboOptions.SectionName));
        services.AddHttpClient(nameof(QboOAuthService));
        services.AddHttpClient(nameof(QboCustomerSyncService));
        services.AddScoped<QboOAuthService>();
        services.AddScoped<IQboCustomerSyncService, QboCustomerSyncService>();
        services.AddScoped<IQboSyncEnqueueService, QboSyncEnqueueService>();
        services.AddScoped<QboSyncRequestProcessor>();
        if (registerWorker)
            services.AddHostedService<QboSyncWorker>();
        return services;
    }
}
