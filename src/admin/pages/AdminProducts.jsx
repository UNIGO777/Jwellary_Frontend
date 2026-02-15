import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ApiError, adminAuthService, api, resolveAssetUrl, withAdminAuth } from '../../services/index.js'
import AdminTopbar from '../components/AdminTopbar.jsx'

const MotionTr = motion.tr

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20
  const q = searchParams.get('q') || ''

  // Fetch Products
  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        params.set('q', q)
        const res = await api.get(`/api/products?${params.toString()}`, withAdminAuth())

        if (!alive) return
        setProducts(Array.isArray(res?.data) ? res.data : [])
        setTotal(Number(res?.total || 0))
      } catch (err) {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setError(getErrorMessage(err))
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [page, limit, navigate, q])

  const handleSearch = (e) => {
    const val = e.target.value
    setSearchParams({ page: 1, limit, q: val })
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, limit, q })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await api.del(`/api/products/${id}`, withAdminAuth())
      // Optimistic update
      setProducts(products.filter(p => p._id !== id))
      setTotal(prev => prev - 1)
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total ? (page - 1) * limit + 1 : 0
  const to = total ? Math.min(page * limit, total) : 0

  return (
    <div>
      <AdminTopbar sectionLabel="Inventory" title="Products" subtitle="Manage your jewelry inventory" showSearch={false} />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-50/50">
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={q}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 bg-white"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <Link 
              to="/admin/products/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-stone-500">Loading...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-stone-500">No products found.</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const making = Number(product?.makingCost?.amount || 0)
                    const other = Number(product?.otherCharges?.amount || 0)
                    const priceRaw = making + other
                    const price = priceRaw > 0 ? `₹${priceRaw.toLocaleString('en-IN')}` : 'N/A'
                    const imagesValue = product?.images
                    const rawImage = (Array.isArray(imagesValue) ? imagesValue[0] : typeof imagesValue === 'string' ? imagesValue : '') || product?.image
                    const image = resolveAssetUrl(rawImage) || 'https://via.placeholder.com/40'
                    const stock = Number(product?.stock || 0)
                    const description = product.description ? String(product.description) : ''
                    const shortDescription = description ? description.slice(0, 44) : ''
                    const showEllipsis = description.length > 44
                    
                    return (
                      <MotionTr
                        key={product._id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="hover:bg-stone-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-stone-200"
                                src={image}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = 'https://via.placeholder.com/40'
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-stone-900">{product.name}</div>
                              {shortDescription ? (
                                <div className="text-sm text-stone-500 truncate max-w-xs">{shortDescription}{showEllipsis ? '…' : ''}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-stone-900">{product?.sku || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {stock} in stock
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/admin/products/${product._id}`} className="text-stone-600 hover:text-stone-900 mr-4">Edit</Link>
                          <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </MotionTr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-stone-200 sm:px-6 bg-stone-50">
             <div className="flex-1 flex justify-between sm:hidden">
                <button 
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages || totalPages <= 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50"
                >
                  Next
                </button>
             </div>
             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-stone-700">
                    Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                       <button
                         key={i}
                         onClick={() => handlePageChange(i + 1)}
                         className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === i + 1 ? 'z-10 bg-stone-50 border-stone-500 text-stone-600' : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'}`}
                       >
                         {i + 1}
                       </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages || totalPages <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
             </div>
          </div>
      </div>
    </div>
  )
}
