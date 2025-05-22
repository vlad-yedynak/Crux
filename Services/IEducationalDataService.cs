using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IEducationalDataService
{
    EducationalDataResponse AddEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> AddEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest);
    
    EducationalDataResponse GetEducationalData(int id);
    Task<EducationalDataResponse> GetEducationalDataAsync(int id);
    
    EducationalDataResponse UpdateEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> UpdateEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest);
}
