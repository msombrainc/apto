using System.Text.Json;
using Apto.Api.Data.Entities;

namespace Apto.Api.QuickBooks;

public sealed record QboCustomerPayload(string DisplayName, string CompanyName)
{
    public static QboCustomerPayload FromAccount(Account account) =>
        new(account.Name, account.Code);

    public string ToJson() => JsonSerializer.Serialize(this);
}
