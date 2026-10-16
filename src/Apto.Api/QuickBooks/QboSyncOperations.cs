namespace Apto.Api.QuickBooks;

public static class QboSyncOperations
{
    public const string CreateCustomer = "CreateCustomer";
    public const string UpdateCustomer = "UpdateCustomer";
    public const string CreateInvoice = "CreateInvoice";

    public static bool IsKnown(string? operation) =>
        operation is CreateCustomer or UpdateCustomer or CreateInvoice;
}

public static class QboSyncRequestStatus
{
    public const string Pending = "Pending";
    public const string Processing = "Processing";
    public const string Sent = "Sent";
    public const string Failed = "Failed";
}

public static class QboSyncEntityTypes
{
    public const string Account = "Account";
    public const string ServiceInvoice = "ServiceInvoice";
}
