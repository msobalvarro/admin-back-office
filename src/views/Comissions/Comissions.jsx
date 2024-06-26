import React, { useEffect, useState } from "react"
import "./Comissions.scss"

// Import components
import Modal from "../../components/Modal/Modal"
import ActivityIndicator from "../../components/ActivityIndicator/Activityindicator"
import Swal from "sweetalert2"

// Import utils
import { Petition, randomKey, copyData, downloadReport } from "../../utils/constanst"
import moment from "moment"

// Import assets
import AlypayLogo from "../../static/images/alypay.png"
import { floor } from "lodash"


const Comissions = () => {
    // Estado para almacenar el valor del texto de filtro
    const [filter, setFilter] = useState('')

    // Estado para almacenar la lista  de comisiones
    const [data, setData] = useState([])

    // Estado para almacenar los datos de un detalle de comision
    const [dataDetail, setDataDetail] = useState({})

    // Estado que almacena el hash de transacción a la hora de aceptar un pago de comisión
    const [transactionHash, setTransactionHash] = useState('')

    // Estado para indicar sponsor se muestra en el detalle y así cambiar el color de su fila dentro de la tabla
    const [activeDetail, setActiveDetail] = useState(-1)

    // Estado para almacenar las fechas para generar los reportes
    const [reportFromDate, setReportFromDate] = useState(moment(new Date()).format("YYYY-MM-DD"))
    const [reportToDate, setReportToDate] = useState(moment(new Date()).format("YYYY-MM-DD"))
    // Estado para controlar la visibilidad del indicador de carga
    const [loaderList, setLoaderList] = useState(false)
    const [loaderDetail, setLoaderDetail] = useState(false)
    const [loaderPayment, setLoaderPayment] = useState(false)
    const [loaderReport, setLoaderReport] = useState(false)

    // Función para obtener los datos de la lista de comisiones
    const getComissionsData = async _ => {
        try {
            setLoaderList(true)

            const { data } = await Petition.get('/admin/comission')

            if (data.error) {
                throw String(data.message)
            }

            setData(data)
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error, 'error')
        } finally {
            setLoaderList(false)
        }
    }

    /**
     * Función para obetener los detalles de un sponsor
     * @param {Number} id - Id del sponsor 
     */
    const getComissionDetailData = async (id) => {
        if (loaderDetail) {
            return
        }

        try {
            setLoaderDetail(true)

            const { data } = await Petition.get(`/admin/comission/${id}`)

            if (data.error) {
                throw String(data.message)
            }

            setDataDetail(data)
            setActiveDetail(id)
            setTransactionHash('')
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error, 'error')
        } finally {
            setLoaderDetail(false)
        }
    }

    /**
     * Función para remover un registro dentro de la lista de comisiones
     * @param {Array} list - Lista de los registros de comisión 
     * @param {Number} removeItem - Id del registro a remover 
     * @returns {Array}
     */
    const removeItemList = (list, removeItem) => {
        list = Array.from(list)

        const indexItem = list.map(item => item.id).indexOf(removeItem)

        if (indexItem !== -1)
            list.splice(indexItem, 1)

        return list
    }

    // Función para aceptar un pago de comisión
    const onHandleAcceptPayment = async _ => {
        try {
            setLoaderPayment(true)

            if (!dataDetail.alypay && transactionHash.length === 0) {
                throw String("El hash de transacción es requerido")
            }

            // Sí todavía no está activa la comisión se pregúnta si en realidad se quiere proceder con el pago
            if (!dataDetail.active) {
                const result = await Swal.fire({
                    title: "Todavía no se han cumplido las 48 horas necesarias, ¿desea realizar el pago de la comisión?",
                    text: "La acción no se puede deshacer",
                    icon: "warning",
                    showCancelButton: true,
                    cancelButtonColor: '#ffcb08',
                    confirmButtonColor: ' #C0392B',
                    confirmButtonText: 'Sí, realizar pago',
                    cancelButtonText: 'Cancelar',
                })

                if (result.dismiss) {
                    return
                }
            }

            // Información a enviar para procesar la solicitud
            const dataSend = {
                id: activeDetail,
                hash: transactionHash.length > 0 ? transactionHash : null
            }

            const { data: result } = await Petition.post('/admin/comission/accept', dataSend)

            if (result.error) {
                throw String(result.message)
            }

            Swal.fire('Listo', 'Pago aprobado con éxito', 'success')

            setData(removeItemList(data, activeDetail))
            setDataDetail({})
            setActiveDetail(-1)
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error, 'error')
        } finally {
            setLoaderPayment(false)
        }
    }

    // Función para rechazar un pago de comisión
    const onHandleDeclinePayment = async (id) => {
        try {
            setLoaderPayment(true)

            const response = await Swal.fire({
                title: "¿Rechazar pago de comisión?",
                text: "La acción no se puede deshacer",
                icon: "warning",
                showCancelButton: true,
                cancelButtonColor: '#ffcb08',
                confirmButtonColor: ' #C0392B',
                confirmButtonText: 'Sí, rechazar pago',
                cancelButtonText: 'Cancelar',
            })

            if (response.dismiss) {
                return
            }

            // Información a enviar para rechazar la solicitud
            const dataSend = {
                id: activeDetail
            }

            const { data: result } = await Petition.post('/admin/comission/decline', dataSend)

            if (result.error) {
                throw String(result.message)
            }

            Swal.fire('Listo', 'Pago rechazado con éxito', 'success')

            setData(removeItemList(data, activeDetail))
            setDataDetail({})
            setActiveDetail(-1)
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error, 'error')
        } finally {
            setLoaderPayment(false)
        }
    }

    /**
     * Función para filtrar los registro de la lista de las comisiones según la entada en
     * el campon  de filtro
     * @param {Array} dataSet - Lista a filtrar 
     * @returns {Array} - Resultado del filtro
     */
    const filterData = (dataSet) => {
        if (filter.length === 0) {
            return dataSet
        }

        const filtered = dataSet.filter(item => {
            const { sponsor, coin, amount } = item

            return (
                sponsor.toLowerCase().search(filter) > -1 ||
                coin.toLowerCase().search(filter) > -1 ||
                amount.toString().toLowerCase().search(filter) > -1
            )
        })

        return filtered
    }

    /**
     * Retorna el tiempo restante de las 48 horas para el estado de pago de la comision
     * @param {Date} _date - Fecha a evaluar 
     * @return {Number} - Tiempo restante en horas
     */
    const getRestTime = (_date) => {
        let now = moment(new Date())
        let fromDate = moment(_date)
        let duration = moment.duration(now.diff(fromDate))

        return floor(48 - duration.asHours(), 0)
    }

    /**
     * Función para obtener el archivo .xls que será el reporte
     */
    const getPaymentReport = async _ => {
        try {
            setLoaderReport(true)

            const { data } = await Petition.get(`/admin/reports/?from=${reportFromDate}&to=${reportToDate}`, {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Disposition': "attachment; filename=template.xlsx",
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            })

            if (data.error) {
                throw String(data.message)
            }

            downloadReport(data, `paymentReport-${reportFromDate}_${reportToDate}.xlsx`)
        } catch (error) {
            Swal.fire("Reporte de pagos", error.toString(), "error")
        } finally {
            setLoaderReport(false)
        }
    }

    useEffect(_ => {
        getComissionsData()
    }, [])

    return (
        <div className="Comissions">
            <div className="Comissions-content">
                <div className="column Comissions-list">
                    <div className="Comissions-list-header">
                        <h2>Comisiones</h2>

                        <div>
                            <input
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                type="text"
                                placeholder="Escribe para buscar..."
                                className="field-input" />
                            <p>
                                <span className="pending">Pendiente</span>
                                <span>|</span>
                                <span className="ready">Listo para pagar</span>
                            </p>
                        </div>
                    </div>

                    {
                        loaderList &&
                        <ActivityIndicator size={46} />
                    }

                    {
                        data.length === 0 && !loaderList &&
                        <p className="empty-detail">No hay comisiones para mostrar</p>
                    }

                    {
                        data.length > 0 && !loaderList &&
                        <div className="table">
                            <div className="header">
                                <span>Nombre</span>
                                <span>Moneda</span>
                                <span>Monto</span>
                                <span>Estado</span>
                            </div>
                            <div className="body">
                                {
                                    filterData(data).map(item => (
                                        <div
                                            key={randomKey()}
                                            onClick={_ => getComissionDetailData(item.id)}
                                            className={`row ${item.id === activeDetail ? 'active' : ''}`}>
                                            <span>{item.sponsor}</span>
                                            <span>{item.coin}</span>
                                            <span>{item.amount} {item.symbol}</span>
                                            <span className={item.active ? 'ready' : 'pending'}></span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    }

                    {/**
                    * Sección para generar los reportes
                    */}
                    <div className="reports">
                        <div className="row">
                            <span>Fecha de inicio</span>
                            <input
                                value={reportFromDate}
                                onChange={e => {
                                    setReportFromDate(e.target.value)
                                }}
                                type="date"
                                className="text-input" />
                        </div>

                        <div className="row">
                            <span>Fecha de final</span>
                            <input
                                value={reportToDate}
                                onChange={e => {
                                    setReportToDate(e.target.value)
                                }}
                                type="date"
                                className="text-input" />
                        </div>

                        <button onClick={getPaymentReport} className="button">Obtener reporte</button>
                    </div>
                </div>

                <div className="column Comissions-detail">
                    <h2>Vista previa de Sponsor</h2>
                    {
                        loaderDetail &&
                        <ActivityIndicator size={46} />
                    }

                    {
                        Object.keys(dataDetail).length === 0 && !loaderDetail &&
                        <p className="empty-detail">No hay ningún elemento seleccionado</p>
                    }

                    {
                        Object.keys(dataDetail).length > 0 && !loaderDetail &&
                        <>
                            <div className="detail-section">
                                <div className="column">
                                    <div className="detail-item">
                                        <span className="label">Nombre</span>
                                        <span className="value">{dataDetail.name}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Correo electrónico</span>
                                        <span className="value">{dataDetail.email}</span>
                                    </div>
                                </div>

                                <div className="column">
                                    <div className="detail-item">
                                        <span className="label">Nombre referido</span>
                                        <span className="value">{dataDetail.client}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Fecha</span>
                                        <span className="value">
                                            {
                                                moment(dataDetail.date).format('MMM. D YYYY, h:mm a')
                                            }

                                            {
                                                moment(new Date()).diff(moment(dataDetail.date), 'hours') < 48
                                                    ? `
                                                (Restan ${getRestTime(dataDetail.date)} hrs.)
                                                `
                                                    : ''
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="column">
                                    <div className="detail-item">
                                        <span className="label">Monto</span>
                                        <span className="value">{dataDetail.amount} {dataDetail.symbol}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Comissión</span>
                                        <span className="value">
                                            {dataDetail.percertage} % | {dataDetail.comission_amount} {dataDetail.symbol}
                                        </span>
                                    </div>
                                </div>

                                <div className="column">
                                    <div className="detail-item">
                                        <span className="label">Moneda</span>
                                        <span className="value">{dataDetail.coin}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Estado</span>
                                        <span className={`value ${dataDetail.active ? 'ready' : 'pending'}`}>
                                            {
                                                dataDetail.active
                                                    ? 'Listo para pagar'
                                                    : 'Pendiente'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-item">
                                <span className="label">Wallet en {dataDetail.symbol}</span>
                                <span
                                    title="Toca para copiar"
                                    onClick={_ => copyData(dataDetail.wallet)}
                                    className="value hash">
                                    {dataDetail.wallet}
                                </span>
                            </div>

                            {
                                !dataDetail.alypay &&
                                <div className="detail-item">
                                    <span className="label">Hash de transacción</span>
                                    <input
                                        value={transactionHash}
                                        onChange={e => setTransactionHash(e.target.value)}
                                        type="text"
                                        placeholder="Hash de transacción"
                                        className="value field-input" />
                                </div>
                            }

                            {
                                dataDetail.alypay &&
                                <div className="detail-item">
                                    <div className="alypay-payment">
                                        <span>&#10003;</span> Pagar con <img src={AlypayLogo} alt="AlyPay" />
                                    </div>
                                </div>
                            }

                            <div className="detail-buttons">
                                <button
                                    onClick={onHandleDeclinePayment}
                                    className="button decline">
                                    Rechazar &#10005;
                                </button>
                                <button
                                    onClick={onHandleAcceptPayment}
                                    className="button confirm">
                                    Aprobar &#10003;
                                </button>
                            </div>
                        </>
                    }
                </div>
            </div>

            {
                (loaderPayment || loaderReport) &&
                <Modal persist={true} onlyChildren>
                    <ActivityIndicator size={64} />
                </Modal>
            }
        </div>
    )
}

export default Comissions