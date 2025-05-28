using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IPersonalizationService
{
    PersonalizationResponse UpdateLessonTime(int userId, PersonalizationRequest request);
    Task<PersonalizationResponse> UpdateLessonTimeAsync(int userId, PersonalizationRequest request);
    
    PersonalizationResponse ResetLessonTime(int userId, int lessonId);
    Task<PersonalizationResponse> ResetLessonTimeAsync(int userId, int lessonId);
    
    PersonalizationResponse ResetAll(int userId);
    Task<PersonalizationResponse> ResetAllAsync(int userId);
    
    ICollection<UserFeedResponse> GetRecommendedResources(int userId);
    Task<ICollection<UserFeedResponse>> GetRecommendedResourcesAsync(int userId);
}
