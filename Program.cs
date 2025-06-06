using Crux.Data;
using Crux.Models.Entities;
using Crux.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Amazon.S3;

Env.Load();

var connectionString = Environment.GetEnvironmentVariable("APP_DB_CONNECTION_STRING");
if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("DB connection string not found");
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IAmazonS3>(sp => new AmazonS3Client(
    Environment.GetEnvironmentVariable("AWS_ACCESS_KEY"),
    Environment.GetEnvironmentVariable("AWS_SECRET_KEY"),
    Amazon.RegionEndpoint.GetBySystemName(Environment.GetEnvironmentVariable("AWS_REGION"))
));

builder.Services.AddSession();
builder.Services.AddHttpClient();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseMySQL(connectionString));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<ICardManagementService, CardService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<IEducationalDataService, EducationalDataService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<IPersonalizationService, PersonalizationService>();
builder.Services.AddScoped<IGeminiApiService, GeminiApiService>();
builder.Services.AddScoped<IS3StorageService, S3StorageService>();
builder.Services.AddScoped<IResourceSearchService, ResourceSearchService>();
builder.Services.AddControllers();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { 
        Title = "Crux API", 
        Version = "v1",
        Description = "API for the Crux application"
    });
});

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

var clientString = Environment.GetEnvironmentVariable("CLIENT_URL");
if (string.IsNullOrEmpty(clientString))
{
    throw new Exception("CLIENT URL not found");
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseStaticFiles();

app.UseCors(option => option
    .WithOrigins(clientString)
    .AllowAnyMethod()
    .AllowAnyHeader());
app.MapControllers();

app.MapGet("/", () => "Цьомчик");

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Crux API v1");
    c.RoutePrefix = "swagger";
});

app.Run();
