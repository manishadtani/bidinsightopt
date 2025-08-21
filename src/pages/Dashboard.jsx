



import React, { useState, useEffect, useRef, useCallback } from "react";
import AlertToggle from "../components/AlertToggle";
import HeroHeading from "../components/HeroHeading";
import BgCover from "../components/BgCover";
import BidTable from "../components/BidTable";
import Pagination from "../components/Pagination";
import FilterPanel from "../components/FilterPanel";
import FilterPanelSaveSearch from "../components/FilterPanelSaveSearch";
import { useNavigate, useLocation } from "react-router-dom";
import { getBidCount, getBids, getSavedSearches } from "../services/bid.service";
import { useDispatch, useSelector } from "react-redux";
import { setBids } from "../redux/reducer/bidSlice";
import { addSavedSearch } from "../redux/reducer/savedSearchesSlice";
import ProfessionalSavedSearchDropdown from '../components/ProfessionalSavedSearchDropdown';
import StatShimmer from "../components/shimmereffects/StatShimmer";
import BidTableShimmer from "../components/shimmereffects/BidTableShimmer";
import { useUserTimezone } from "../timezone/useUserTimezone";
import { fetchUserProfile } from "../redux/reducer/profileSlice";

// 🔥 IMPORT URL HELPERS AND CONSTANTS
import { decodeUrlToFilters, buildQueryString } from "../utils/urlHelpers";
import { DASHBOARD_CONSTANTS } from "../utils/constants";

// 🔥 IMPORT CUSTOM HOOKS
import { useSearchHandling } from "../hooks/useSearchHandling";
import { useFilterHandling } from "../hooks/useFilterHandling";
import { useDashboardUI } from "../hooks/useDashboardUI";

function Dashboard() {
  const perPage = DASHBOARD_CONSTANTS.PER_PAGE;
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef();
  const bidsSectionRef = useRef(null);
  const dispatch = useDispatch();
  const { bidsInfo } = useSelector((state) => state.bids);
  const { savedSearches } = useSelector((state) => state.savedSearches);
  const { timezone: userTimezone } = useUserTimezone();

  // 🔥 USE CUSTOM HOOKS
  const {
    filters,
    setFilters,
    appliedFilters,
    setAppliedFilters,
    currentPage,
    setCurrentPage,
    isInitialLoad,
    handleFiltersApply,
    handleSort
  } = useFilterHandling(perPage);

  const {
    topSearchTerm,
    setTopSearchTerm,
    handleSearchInputChange
  } = useSearchHandling(appliedFilters, perPage);

  const {
    sidebarToggle,
    setSidebarToggle,
    saveSearchToggle,
    setSaveSearchToggle,
    activeFilterTab,
    setActiveFilterTab,
    searchOption,
    selectedSavedSearch,
    setSelectedSavedSearch,
    saveSearchFilters,
    setSaveSearchFilters,
    handleOpenFilter
  } = useDashboardUI();

  // 🔥 REMAINING LOCAL STATE
  const [bidCount, setBidCount] = useState({ count: 0, new_bids: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { timezone, locationPermission } = useUserTimezone();

  const profile = useSelector((state) => state.profile.profile);
  const companyName = profile?.company_name || "";
  const formattedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
  const data = { title: `${formattedName}'s Dashboard` };



  // 🔥 BROWSER HISTORY MANAGEMENT
  useEffect(() => {
    const handlePopState = (e) => {
      // Don't prevent the default back button behavior
      // Let React Router handle the navigation properly
      console.log("🔥 Browser back/forward detected");
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);



  // 🔥 FETCH BID COUNT
  useEffect(() => {
    const fetchBidCount = async () => {
      try {
        const countData = await getBidCount();
        setBidCount(countData);
      } catch (error) {
        console.error("❌ Error fetching bid count:", error);
      }
    };
    fetchBidCount();
  }, []);

  const middle = [
    {
      id: 1,
      title: "Total Bids",
      num: bidCount?.count || 0,
      tag: "FILTER",
      description: "Narrow down bids by industry, status, location and more."
    },
    {
      id: 2,
      title: "Active Bids",
      num: bidsInfo?.count || 0,
      tag: "ACTIVE BIDS",
      description: "Bids that haven’t been closed/awarded yet!"
    },
    {
      id: 3,
      title: "New Bids",
      num: bidCount?.new_bids || 0,
      tag: "NEW BIDS",
      description: "Bids added in the last 24 hours."
    },
    {
      id: 4,
      title: "Saved",
      num: "0",
      tag: "SAVE",
      description: "Bookmark bids you’re interested in so you can check them out later."
    },
    {
      id: 5,
      title: "Followed",
      num: "0/25",
      tag: "FOLLOW",
      description: "Get instant updates on changes & deadlines for these bids."
    }
  ];

  // 🔥 FETCH BIDS FUNCTION
  const fetchBids = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("User not logged in");
      dispatch(setBids([]));
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const hasActiveFilters =
        appliedFilters.status !== "Active" ||
        (appliedFilters.location?.length > 0) ||
        (appliedFilters.solicitationType?.length > 0) ||
        (appliedFilters.keyword?.include?.length > 0) ||
        (appliedFilters.keyword?.exclude?.length > 0) ||
        (appliedFilters.UNSPSCCode?.length > 0) ||
        (appliedFilters.NAICSCode?.length > 0) ||
        appliedFilters.publishedDate?.after ||
        appliedFilters.publishedDate?.before ||
        appliedFilters.closingDate?.after ||
        appliedFilters.closingDate?.before ||
        appliedFilters.entityType;

      const filtersToUse = hasActiveFilters
        ? appliedFilters
        : { ...appliedFilters, status: "Active" };

      let queryString = buildQueryString(filtersToUse, currentPage, perPage);

      const searchParams = new URLSearchParams(location.search);
      const searchTermFromUrl = searchParams.get("search") || "";

      console.log("🔥 Fetching bids with query:", queryString);
      console.log("🔥 Search term from URL:", searchTermFromUrl);

      const res = await getBids(`?${queryString}`, searchTermFromUrl);
      console.log(res, "🔥 Fetched bids data");
      dispatch(setBids(res));
    } catch (err) {
      console.error("Failed to fetch bids:", err);
      setError("Failed to fetch bids");
    } finally {
      setLoading(false);
    }
  }, [currentPage, navigate, perPage, appliedFilters, dispatch, location.search]);

  // 🔥 ENTITY TYPE CHANGE HANDLER
  const handleEntityTypeChange = (entityType) => {
    const updatedFilters = {
      ...appliedFilters,
      entityType: entityType
    };

    setFilters(updatedFilters);
    setAppliedFilters(updatedFilters);
    setCurrentPage(1);

    const searchParams = new URLSearchParams(location.search);
    const queryString = buildQueryString(updatedFilters, 1, perPage);

    // 🔥 Preserve saved search ID if it exists
    const savedSearchId = searchParams.get("id");
    const finalURL = savedSearchId
      ? `/dashboard?${queryString}&id=${savedSearchId}`
      : `/dashboard?${queryString}`;

    navigate(finalURL);
  };

  // 🔥 FETCH BIDS ON LOAD
  useEffect(() => {
    if (!isInitialLoad) {
      fetchBids();
    }
  }, [fetchBids, isInitialLoad]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const savedSearchId = searchParams.get("id");

    if (savedSearchId && savedSearches.length > 0) {
      // Find the saved search by ID
      const matchedSearch = savedSearches.find((item) => item.id.toString() === savedSearchId);

      if (matchedSearch) {
        console.log("🔥 Restoring saved search from URL:", matchedSearch.name);

        // Set the selected saved search state
        setSelectedSavedSearch({
          id: matchedSearch.id,
          name: matchedSearch.name,
          query_string: matchedSearch.query_string
        });
      }
    } else if (!savedSearchId) {
      // Clear selection if no ID in URL
      setSelectedSavedSearch(null);
    }
  }, [location.search, savedSearches]);

  // 🔥 FETCH SAVED SEARCHES
  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedSearches = await getSavedSearches();
        console.log("🔥 Fetched saved searches:", savedSearches);
        dispatch(addSavedSearch(savedSearches));
      } catch (error) {
        console.error("Error fetching saved searches:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  // 🔥 FETCH USER PROFILE
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // 🔥 SAVED SEARCH SELECT HANDLER
  const handleSavedSearchSelect = async (searchId) => {
    if (searchId === "_default_" || !searchId) {
      const defaultFilters = { ...DASHBOARD_CONSTANTS.DEFAULT_FILTERS, ordering: "closing_date" };

      console.log("🔥 Resetting to default dashboard state");

      setFilters(defaultFilters);
      setAppliedFilters(defaultFilters);
      setSelectedSavedSearch(null); // Clear the selection
      setSaveSearchFilters({});
      setCurrentPage(1);
      setTopSearchTerm("");

      // Navigate without the ID parameter
      navigate("/dashboard?page=1&pageSize=25&bid_type=Active&ordering=closing_date");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const matched = savedSearches.find((item) => item.id === searchId);
      console.log(matched?.query_string, "🔥 Matched saved search");
      if (!matched) return;

      const urlParams = new URLSearchParams(matched.query_string);
      const decodedFilters = decodeUrlToFilters(urlParams);

      // Ensure ordering is preserved or set default
      if (!decodedFilters.ordering) {
        decodedFilters.ordering = "closing_date";
      }
      console.log(decodedFilters, "🔥 Decoded filters from saved search");

      // Set the selected saved search state BEFORE navigation
      setSelectedSavedSearch({
        id: matched.id,
        name: matched.name,
        query_string: matched.query_string
      });

      setSaveSearchFilters(matched.query_string);
      setFilters(decodedFilters);
      setAppliedFilters(decodedFilters);
      setCurrentPage(1);

      const searchFromSaved = urlParams.get("search");
      setTopSearchTerm(searchFromSaved || "");

      let cleanQueryString = matched.query_string;
      if (cleanQueryString.startsWith('?')) {
        cleanQueryString = cleanQueryString.substring(1);
      }

      const urlParamsForNav = new URLSearchParams(cleanQueryString);
      if (!urlParamsForNav.has('ordering')) {
        urlParamsForNav.set('ordering', 'closing_date');
      }
      urlParamsForNav.set('page', '1');
      urlParamsForNav.set('pageSize', '25');
      urlParamsForNav.set('id', matched.id); // Make sure ID is included

      // Navigate with the ID parameter
      const fullURL = `/dashboard?${urlParamsForNav.toString()}`;
      navigate(fullURL);
    } catch (err) {
      console.error("Failed to load saved search filters", err);
    }
  };











  // 🔥 ENHANCED FILTER APPLY HANDLER (with search term clearing)
  const enhancedHandleFiltersApply = (newFilters) => {

    const filtersWithOrdering = {
      ...newFilters,
      ordering: newFilters.ordering || appliedFilters.ordering || "closing_date"
    };

    setTopSearchTerm(""); // Clear search term when filters are applied
    handleFiltersApply(newFilters);
  };

  // 🔥 REMAINING HANDLERS
  const handleSaveOrUpdate = (data) => {
    console.log("Save or Update called with data:", data);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (bidsSectionRef.current) {
        bidsSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleExport = () => {
    if (tableRef.current) {
      tableRef.current.exportToCSV();
    }
  };

  return (
    <>
      <div className="py-[120px] bg-blue">
        {sidebarToggle && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClose={() => setSidebarToggle(false)}
            activeTab={activeFilterTab}
            setActiveTab={setActiveFilterTab}
            onApply={enhancedHandleFiltersApply}
          />
        )}

        {saveSearchToggle && (
          <FilterPanelSaveSearch
            filters={saveSearchFilters}
            setFilters={setSaveSearchFilters}
            onClose={() => setSaveSearchToggle(false)}
            onSave={handleSaveOrUpdate}
            selectedSearch={selectedSavedSearch}
            mode={searchOption}
            setSelectedSearch={setSelectedSavedSearch}
            savedSearches={savedSearches}
            onApply={() => setSaveSearchToggle(false)}
          />
        )}

        <div className="container-fixed py-10 px-4">
          <div className="dashboard-header flex justify-between items-center">
            <HeroHeading data={data} />
            <div className="flex items-center gap-[15px]">
              <span className="font-inter text-[#DBDBDB]">Alert</span>
              <AlertToggle />
              <div className="search-box bg-btn p-4 px-6 flex gap-3 items-center rounded-[30px]">
                <i className="far text-white fa-search"></i>
                <input
                  type="text"
                  placeholder="Search titles or organization or location"
                  className="text-white bg-transparent w-[300px] border-none outline-none"
                  value={topSearchTerm}
                  onChange={handleSearchInputChange}
                />
              </div>
            </div>
          </div>

          <div className="dashboard-feature pt-44">
            <div className="flex justify-between items-center">
              <div className="feature-left">
                <div
                  className="bg-btn p-4 w-[56px] h-[56px] rounded-[16px] flex justify-center items-center cursor-pointer"
                  onClick={handleOpenFilter}
                  id="filter"
                >
                  <img
                    src={sidebarToggle ? "close.png" : "filter.png"}
                    className="w-6"
                    alt="Filter Toggle"
                  />
                </div>
              </div>

              <div className="dashboard-middle">
                {loading ? (
                  <StatShimmer />
                ) : (
                  <div className="flex gap-3 text-[1em]">
                    {middle.map((item) => (
                      <BgCover key={item.id} description={item.description} title={item.title}>
                        <div className="flex gap-2">
                          <div className="text font-inter text-[#DBDBDB]">
                            {item.title}
                          </div>
                          <p className="num font-inter font-semibold text-white">
                            {item.num}
                          </p>
                        </div>
                      </BgCover>
                    ))}
                  </div>
                )}
              </div>

              <div className="feature-right">
                <div className="flex gap-4 items-center">
                  <div
                    className="bg-btn p-4 rounded-[16px] cursor-pointer"
                    onClick={handleExport}
                    id="export"
                  >
                    <img src="export.png" className="w-6" alt="Export" />
                  </div>

                  <ProfessionalSavedSearchDropdown
                    savedSearches={savedSearches}
                    selectedSavedSearch={selectedSavedSearch}
                    handleSavedSearchSelect={handleSavedSearchSelect}
                  />

                  <BgCover>
                    <div
                      className="text-white cursor-pointer"
                      onClick={() => setSaveSearchToggle(true)}
                    >
                      Save Search
                    </div>
                  </BgCover>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full" ref={bidsSectionRef}>
            {loading ? (
              <div className="text-white text-center py-10">
                <BidTableShimmer />
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-10">{error}</div>
            ) : (
              <BidTable
                timezone={userTimezone}
                bids={bidsInfo?.results || []}
                onEntityTypeChange={handleEntityTypeChange}
                currentEntityType={appliedFilters.entityType || ""}
                totalCount={bidsInfo?.count || 0}
                currentSortField={appliedFilters.ordering || "closing_date"}
                currentSortOrder={appliedFilters.ordering?.startsWith('-') ? 'desc' : 'asc'}
                onSort={handleSort}
                ref={tableRef}
              />
            )}

            <Pagination
              totalResults={bidsInfo?.count || 0}
              perPage={bidsInfo?.page_size || perPage}
              currentPage={bidsInfo?.page || currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;