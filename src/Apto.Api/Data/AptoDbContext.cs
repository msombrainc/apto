using Apto.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Apto.Api.Data;

public class AptoDbContext(DbContextOptions<AptoDbContext> options) : DbContext(options)
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<PartNumber> PartNumbers => Set<PartNumber>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<QboConnection> QboConnections => Set<QboConnection>();
    public DbSet<QboSyncRequest> QboSyncRequests => Set<QboSyncRequest>();
    public DbSet<AssetChangeLog> AssetChangeLogs => Set<AssetChangeLog>();
    public DbSet<ReferenceItem> ReferenceItems => Set<ReferenceItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Code).HasMaxLength(50);
            e.Property(x => x.QboCustomerId).HasMaxLength(50);
            e.Property(x => x.QboSyncStatus).HasMaxLength(20);
            e.Property(x => x.QboSyncError).HasMaxLength(2000);
        });

        modelBuilder.Entity<QboConnection>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RealmId).HasMaxLength(50);
        });

        modelBuilder.Entity<QboSyncRequest>(e =>
        {
            e.Property(x => x.Operation).HasMaxLength(32);
            e.Property(x => x.EntityType).HasMaxLength(32);
            e.Property(x => x.Status).HasMaxLength(16);
            e.Property(x => x.LastError).HasMaxLength(2000);
            e.Property(x => x.QboId).HasMaxLength(64);
            e.HasIndex(x => new { x.Status, x.CreatedAtUtc });
        });

        modelBuilder.Entity<Job>(e =>
        {
            e.HasOne(x => x.Account).WithMany(x => x.Jobs).HasForeignKey(x => x.AccountId);
            e.Property(x => x.FacilityCode).HasMaxLength(10);
            e.Property(x => x.OpsStatus).HasMaxLength(50);
        });

        modelBuilder.Entity<Asset>(e =>
        {
            e.HasOne(x => x.Job).WithMany(x => x.Assets).HasForeignKey(x => x.JobId);
            e.HasOne(x => x.PartNumber).WithMany(x => x.Assets).HasForeignKey(x => x.PartNumberId);
            e.Property(x => x.SerialNumber).HasMaxLength(100);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<ReferenceItem>(e =>
        {
            e.Property(x => x.Type).HasMaxLength(64);
            e.Property(x => x.Code).HasMaxLength(32);
            e.Property(x => x.Name).HasMaxLength(128);
            e.Property(x => x.Group).HasMaxLength(32);
            e.Property(x => x.CertificateGroup).HasMaxLength(32);
            e.HasIndex(x => new { x.Type, x.Code });
            e.HasIndex(x => new { x.Type, x.ParentId, x.Code });
            e.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PartNumber>(e =>
        {
            e.HasIndex(x => x.Number).IsUnique();
            e.Property(x => x.Number).HasMaxLength(100);
            e.HasOne(x => x.Category).WithMany(x => x.PartNumbers).HasForeignKey(x => x.CategoryId);
        });

        modelBuilder.Entity<AssetChangeLog>(e =>
        {
            e.HasOne(x => x.Asset).WithMany().HasForeignKey(x => x.AssetId);
            e.Property(x => x.FieldName).HasMaxLength(100);
            e.Property(x => x.OldValue).HasMaxLength(500);
            e.Property(x => x.NewValue).HasMaxLength(500);
            e.Property(x => x.ChangedBy).HasMaxLength(100);
            e.HasIndex(x => x.AssetId);
        });
    }
}
