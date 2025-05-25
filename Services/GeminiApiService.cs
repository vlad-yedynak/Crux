using System.Text;
using System.Text.Json;
using Crux.Models.DTOs;
using Crux.Models.Responses;

namespace Crux.Services;

public class GeminiApiService(
    HttpClient httpClient,
    string baseUrl ="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    ) : IGeminiApiService
{
    public async Task<string> SummarizeContentAsync(string content, int maxWords = 50)
    {
        var prompt = $"Summarize the following content in {maxWords} words or less. Focus on the key points and main ideas:\n\n{content}";
        return await SendGeminiRequestAsync(prompt);
    }

    public async Task<string> GenerateDescriptionAsync(string title, string snippet)
    {
        var prompt = $"Based on this title: '{title}' and snippet: '{snippet}', generate a clear, engaging description (max 100 words) that would help users understand what this resource is about.";
        return await SendGeminiRequestAsync(prompt);
    }

    public async Task<List<string>> GenerateSearchSuggestionsAsync(string topic)
    {
        var prompt = $"Generate 5 related search suggestions for the topic: '{topic}'. Return only the suggestions, one per line, without numbering or bullets.";
        var response = await SendGeminiRequestAsync(prompt);
        return response.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                      .Select(s => s.Trim())
                      .Where(s => !string.IsNullOrEmpty(s))
                      .Take(5)
                      .ToList();
    }

    public async Task<string> AnalyzeSentimentAsync(string text)
    {
        var prompt = $"Analyze the sentiment of this text and return only one word: 'Positive', 'Negative', or 'Neutral':\n\n{text}";
        return await SendGeminiRequestAsync(prompt);
    }

    public async Task<string> ExtractKeyPointsAsync(string content)
    {
        var prompt = $"Extract the 3 most important key points from this content. Return them as bullet points:\n\n{content}";
        return await SendGeminiRequestAsync(prompt);
    }

    public async Task<UserFeedResponse> EnhanceSearchResultAsync(UserFeedResponse result)
    {
        try
        {
            if (string.IsNullOrEmpty(result.Title))
            {
                return result;
            }

            var enhancedDescription = await GenerateDescriptionAsync(
                result.Title, 
                result.Message ?? "No description available"
            );

            return new UserFeedResponse
            {
                Title = result.Title,
                Url = result.Url,
                Thumbnail = result.Thumbnail,
                Message = enhancedDescription,
                Success = result.Success,
                Error = result.Error
            };
        }
        catch (Exception)
        {
            return result;
        }
    }

    private async Task<string> SendGeminiRequestAsync(string prompt)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.7,
                topK = 40,
                topP = 0.95,
                maxOutputTokens = 1024
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var apiKey = Environment.GetEnvironmentVariable("GOOGLE_GEMINI_API_KEY");

        var url = $"{baseUrl}?key={apiKey}";
        var response = await httpClient.PostAsync(url, content);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Gemini API request failed: {response.StatusCode}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var geminiResponse = JsonSerializer.Deserialize<GeminiFullApiResponse>(responseContent);

        return geminiResponse?.Candidates.FirstOrDefault()?.Content.Parts.FirstOrDefault()?.Text ?? "No response generated";
    }
}
