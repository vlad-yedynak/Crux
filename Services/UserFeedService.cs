using System.Text;
using System.Text.Json;
using Crux.Models.DTOs;
using Crux.Models.Responses;

namespace Crux.Services
{
    public class UserFeedService(HttpClient httpClient) : IUserFeedService
    {
        public async Task<ICollection<UserFeedResponse>> GetUserFeedResourcesAsync(string detailedTopic, int numberOfResourcesToRequest = 3)
        {
            var apiKey = Environment.GetEnvironmentVariable("GOOGLE_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return [];
            }

            var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

            var requestPayload = new GeminiApiRequest
            {
                Contents = new List<GeminiRequestContent>
                {
                    new GeminiRequestContent
                    {
                        Parts = new List<GeminiRequestPart>
                        {
                            new GeminiRequestPart
                            {
                                Text = $"Please provide {numberOfResourcesToRequest} links to high-quality online resources (such as articles, video tutorials, or interactive demos) suitable for a learner in computer graphics who is studying the following topic: {detailedTopic}."
                            }
                        }
                    }
                },
                GenerationConfig = new GeminiGenerationConfig
                {
                    ResponseMimeType = "application/json",
                    ResponseSchema = new GeminiResponseSchema
                    {
                        Type = "ARRAY",
                        Items = new GeminiResponseSchemaItem
                        {
                            Type = "OBJECT",
                            Properties = new Dictionary<string, GeminiResponseSchemaProperty>
                            {
                                { "title", new GeminiResponseSchemaProperty { Type = "STRING" } },
                                { "url", new GeminiResponseSchemaProperty { Type = "STRING" } }
                            }
                        }
                    }
                }
            };

            try
            {
                var jsonPayload = JsonSerializer.Serialize(requestPayload);
                var httpContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync(apiUrl, httpContent);
                var rawResponseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var fullApiResponse = JsonSerializer.Deserialize<GeminiFullApiResponse>(rawResponseContent);

                    if (fullApiResponse?.Candidates != null && fullApiResponse.Candidates.Count != 0)
                    {
                        var firstCandidate = fullApiResponse.Candidates[0];
                        
                        if (firstCandidate.Content.Parts.Count != 0)
                        {
                            var resourcesJsonString = firstCandidate.Content.Parts[0].Text;

                            if (!string.IsNullOrWhiteSpace(resourcesJsonString))
                            {
                                var geminiResources = JsonSerializer.Deserialize<List<GeminiResourceItem>>(resourcesJsonString);

                                if (geminiResources == null || geminiResources.Count == 0)
                                {
                                    return Array.Empty<UserFeedResponse>();
                                }

                                return geminiResources.Select(gr => new UserFeedResponse
                                {
                                    Success = true,
                                    Title = gr.Title,
                                    Url = gr.Url
                                }).ToList();
                            }
                        }
                    }
                }

                return [];
            }
            catch (Exception)
            {
                return [];
            }
        }
    }
}
