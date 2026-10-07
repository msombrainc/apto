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
        });

        modelBuilder.Entity<PartNumber>(e =>
        {
            e.HasIndex(x => x.Number).IsUnique();
            e.Property(x => x.Number).HasMaxLength(100);
            e.HasOne(x => x.Category).WithMany(x => x.PartNumbers).HasForeignKey(x => x.CategoryId);
        });
    }
}
