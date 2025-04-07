using Crux.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
using (var dbContext = new ApplicationDbContext())
{
    try
    {
        dbContext.SetConnectionString(connectionString);
    }
    catch (ApplicationException e)
    {
        Console.WriteLine(e);
        throw;
    }
    
    dbContext.Database.EnsureCreated();
}

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => "Цьомчик");

app.Run();
